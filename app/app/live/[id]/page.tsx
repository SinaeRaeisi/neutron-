"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Radio, Send, MessageSquare, Lock, Clock,
  AlertCircle, FileText, Download, Globe, EyeOff, Loader2, Play,
} from "lucide-react";
import { liveClasses as baseLive, getTeacher, getCourse } from "@/lib/data";
import { getAttempts } from "@/lib/store";
import { LiveViewer } from "@/components/LiveViewer";
import type { LiveClass } from "@/lib/types";

interface Msg {
  id: string;
  userId: string;
  userName: string;
  userRole: "student" | "teacher" | "admin";
  text: string;
  createdAt: string;
}
interface ChatState { chatMode: "public" | "private"; chatLocked: boolean; }
interface Me { id: string; name: string; role: string; subscription?: unknown; }

export default function LiveRoomPage({ params }: { params: { id: string } }) {
  const [live, setLive] = useState<LiveClass | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chatState, setChatState] = useState<ChatState>({ chatMode: "public", chatLocked: false });
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(m => setMe(m)).catch(() => {});
    async function findLive() {
      const base = baseLive.find(l => l.id === params.id);
      if (base) { setLive(base); return; }
      try {
        const r = await fetch("/api/live-classes");
        if (r.ok) {
          const d = await r.json();
          const found = (d.classes as LiveClass[]).find(c => c.id === params.id);
          if (found) setLive(found);
        }
      } catch { /* noop */ }
    }
    findLive();
  }, [params.id]);

  useEffect(() => {
    if (!live?.requiredQuizId) return;
    fetch(`/api/quizzes/${live.requiredQuizId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.quiz) setQuizTitle(d.quiz.title); })
      .catch(() => {});
  }, [live?.requiredQuizId]);

  // polling چت
  useEffect(() => {
    async function sync() {
      try {
        const r = await fetch(`/api/live-chat/${params.id}`);
        if (r.ok) {
          const d = await r.json();
          setMessages(d.messages ?? []);
          setChatState(d.state ?? { chatMode: "public", chatLocked: false });
        }
      } catch { /* noop */ }
      setLoaded(true);
    }
    sync();
    const t = setInterval(sync, 2500);
    return () => clearInterval(t);
  }, [params.id]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  async function joinBroadcast() {
    try {
      const r = await fetch(`/api/live-signaling/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", role: "viewer" }),
      });
      if (r.ok) {
        const d = await r.json();
        setPeerId(d.peerId);
        setJoined(true);
      } else {
        const d = await r.json().catch(() => ({}));
        setErr(d.error ?? "پیوستن ناموفق.");
      }
    } catch { setErr("خطای شبکه."); }
  }

  async function send() {
    if (!text.trim()) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/live-chat/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error ?? "ارسال ناموفق.");
        return;
      }
      setText("");
    } catch { setErr("خطای شبکه."); }
    finally { setBusy(false); }
  }

  if (!loaded) return <div className="card text-center py-12 text-muted text-sm">…</div>;
  if (!live) return (
    <div className="card text-center py-12">
      <p className="text-muted mb-4">کلاس یافت نشد.</p>
      <Link href="/app/live" className="btn-ghost">بازگشت</Link>
    </div>
  );

  const teacher = getTeacher(live.teacherId);
  const course = getCourse(live.courseId);
  const hasSub = !!me?.subscription;
  const startMs = new Date(live.scheduledAt).getTime();
  const endMs = startMs + live.durationMin * 60 * 1000;
  const now = Date.now();
  const canEnter = now >= startMs && now <= endMs;

  if (!hasSub) return (
    <div className="card text-center py-12 max-w-md mx-auto">
      <Lock className="w-10 h-10 text-muted mx-auto mb-3" />
      <p className="text-muted mb-4">برای ورود، اشتراک فعال لازم است.</p>
      <Link href="/app/subscription" className="btn-primary">خرید اشتراک</Link>
    </div>
  );

  if (!canEnter) {
    const dt = new Date(live.scheduledAt);
    return (
      <div className="card text-center py-12 max-w-md mx-auto">
        <Clock className="w-10 h-10 text-muted mx-auto mb-3" />
        <p className="text-muted mb-1">
          {now < startMs ? "کلاس هنوز شروع نشده." : "کلاس تمام شده."}
        </p>
        <p className="text-xs text-muted mb-4">
          {dt.toLocaleDateString("fa-IR")} ساعت {dt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <Link href="/app/live" className="btn-ghost">بازگشت</Link>
      </div>
    );
  }

  if (live.requiredQuizId) {
    const attempts = getAttempts();
    const hasPassed = attempts.some(a => a.quizId === live.requiredQuizId);
    if (!hasPassed) {
      return (
        <div className="card text-center py-12 max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-amber mx-auto mb-3" />
          <p className="font-bold mb-2">قبل از ورود، آزمون پیش‌نیاز</p>
          <p className="text-sm text-muted mb-5">
            {quizTitle ? `«${quizTitle}»` : "آزمون پیش‌نیاز"} را باید اول کامل کنی.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href={`/app/quiz/${live.requiredQuizId}`} className="btn-primary">رفتن به آزمون</Link>
            <Link href="/app/live" className="btn-ghost">بازگشت</Link>
          </div>
        </div>
      );
    }
  }

  const isLocked = chatState.chatLocked;
  const isPrivate = chatState.chatMode === "private";

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Link href="/app/live" className="text-sm text-muted hover:text-lime inline-flex items-center gap-1">
        <ArrowRight className="w-3.5 h-3.5" /> بازگشت
      </Link>

      <header>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="chip text-[10px] border-danger/40 text-danger bg-danger/10">
            <Radio className="w-3 h-3 animate-pulse-soft" /> در حال پخش
          </span>
          {course && <span className="chip text-[10px]">{course.subject}</span>}
        </div>
        <h1 className="h2">{live.title}</h1>
        <p className="text-sm text-muted mt-1">با {teacher?.name}</p>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-3">
          <LiveViewer
            liveId={params.id}
            peerId={peerId}
            onNeedJoin={joinBroadcast}
          />

          {err && !joined && (
            <p className="text-xs text-danger bg-danger/10 p-2 rounded">{err}</p>
          )}
        </div>

        <div className="card flex flex-col max-h-[520px]">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <MessageSquare className="w-4 h-4 text-lime" />
            <h2 className="font-bold text-sm">چت</h2>
            {isPrivate ? (
              <span className="chip text-[10px] border-violet/40 text-violet mr-auto">
                <EyeOff className="w-3 h-3" /> خصوصی
              </span>
            ) : (
              <span className="chip text-[10px] border-lime/40 text-lime mr-auto">
                <Globe className="w-3 h-3" /> عمومی
              </span>
            )}
            {isLocked && (
              <span className="chip text-[10px] border-danger/40 text-danger"><Lock className="w-3 h-3" /></span>
            )}
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto py-3 space-y-2 min-h-[200px]">
            {messages.length === 0 ? (
              <p className="text-xs text-muted text-center py-8">هنوز پیامی نیست.</p>
            ) : (
              messages.map(m => {
                const isMe = m.userId === me?.id;
                const isTeacher = m.userRole === "teacher" || m.userRole === "admin";
                return (
                  <div key={m.id} className={`text-sm ${isMe ? "text-left" : ""}`}>
                    <div className={`inline-block max-w-[85%] rounded-xl2 px-3 py-2 ${
                      isMe ? "bg-lime/15 border border-lime/20" :
                      isTeacher ? "bg-violet/10 border border-violet/20" : "bg-ink-3"
                    }`}>
                      <div className="text-[10px] text-muted mb-0.5">
                        {m.userName}
                        {isTeacher && <span className="text-violet mr-1"> · معلم</span>}
                        {" · "}
                        {new Date(m.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-paper/90 whitespace-pre-wrap">{m.text}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-line space-y-2">
            {isLocked && (
              <p className="text-[11px] text-danger bg-danger/10 px-2 py-1.5 rounded-lg flex items-center gap-1">
                <Lock className="w-3 h-3" /> چت توسط معلم قفل شده
              </p>
            )}
            {err && joined && <p className="text-[11px] text-danger">{err}</p>}
            <div className="flex gap-2">
              <input
                className="input flex-1 py-2 text-sm"
                placeholder={isLocked ? "چت قفل است" : "پیام…"}
                value={text}
                disabled={isLocked}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !isLocked && send()}
              />
              <button onClick={send} disabled={!text.trim() || busy || isLocked} className="btn-primary btn-sm">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {(live.notes?.trim() || (live.attachments && live.attachments.length > 0)) && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-lime" />
            <h2 className="font-bold text-sm">جزوهٔ این جلسه</h2>
          </div>
          {live.notes?.trim() && (
            <div className="text-sm text-paper/90 leading-loose whitespace-pre-wrap mb-3">
              {live.notes}
            </div>
          )}
          {live.attachments && live.attachments.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-line">
              <div className="text-xs text-muted font-semibold mb-1">فایل‌های پیوست:</div>
              {live.attachments.map(att => (
                <a key={att.id} href={att.url} download={att.name}
                  className="flex items-center gap-3 p-2.5 rounded-xl2 bg-ink-3 border border-line hover:border-lime/40 transition group">
                  <div className="w-9 h-9 rounded-lg bg-lime/15 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4 text-lime" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-lime">{att.name}</div>
                    <div className="text-xs text-muted">
                      {(att.size / 1024 / 1024).toFixed(2)} مگابایت
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}