"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Radio, Send, MessageSquare,
  Lock, Unlock, Globe, EyeOff, Loader2, UserX, VolumeX, Volume2,
} from "lucide-react";
import { liveClasses as baseLive, getTeacher, getCourse } from "@/lib/data";
import { formatIranDate, formatIranTime } from "@/lib/iran-time";
import { LiveBroadcaster } from "@/components/LiveBroadcaster";
import type { LiveClass } from "@/lib/types";

interface Msg {
  id: string;
  userId: string;
  userName: string;
  userRole: "student" | "teacher" | "admin";
  text: string;
  createdAt: string;
}
interface ChatState {
  chatMode: "public" | "private";
  chatLocked: boolean;
  bannedFromChat: string[];
  kickedFromLive: string[];
}

export default function TeacherLiveRoom({ params }: { params: { id: string } }) {
  const [live, setLive] = useState<LiveClass | null>(null);
  const [me, setMe] = useState<{ id: string; name: string; role: string } | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chatState, setChatState] = useState<ChatState>({
    chatMode: "public", chatLocked: false, bannedFromChat: [], kickedFromLive: [],
  });
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(m => setMe(m)).catch(() => {});
    async function findLive() {
      const base = baseLive.find(l => l.id === params.id);
      if (base) { setLive(base); setLoaded(true); return; }
      try {
        const r = await fetch("/api/live-classes", { cache: "no-store" });
        if (r.ok) {
          const d = await r.json();
          const found = (d.classes as LiveClass[]).find(c => c.id === params.id);
          if (found) setLive(found);
        }
      } catch { /* noop */ }
      setLoaded(true);
    }
    findLive();
  }, [params.id]);

  useEffect(() => {
    if (!live) return;
    const startMs = new Date(live.scheduledAt).getTime();
    const endMs = startMs + live.durationMin * 60 * 1000;
    const now = Date.now();
    if (now < startMs || now > endMs) return;

    fetch(`/api/live-signaling/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", role: "host" }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.peerId) setPeerId(d.peerId); })
      .catch(() => {});
  }, [live?.id, params.id]);

  useEffect(() => {
    async function sync() {
      try {
        const r = await fetch(`/api/live-chat/${params.id}`, { cache: "no-store" });
        if (r.ok) {
          const d = await r.json();
          setMessages(d.messages ?? []);
          setChatState({
            chatMode: d.state?.chatMode ?? "public",
            chatLocked: d.state?.chatLocked ?? false,
            bannedFromChat: d.state?.bannedFromChat ?? [],
            kickedFromLive: d.state?.kickedFromLive ?? [],
          });
        }
      } catch { /* noop */ }
    }
    sync();
    const t = setInterval(sync, 2500);
    return () => clearInterval(t);
  }, [params.id]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

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

  async function updateState(patch: Partial<Pick<ChatState, "chatMode" | "chatLocked">> & { banUser?: string; unbanUser?: string }) {
    try {
      const res = await fetch(`/api/live-chat/${params.id}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const d = await res.json();
        setChatState(s => ({
          ...s,
          chatMode: d.state.chatMode,
          chatLocked: d.state.chatLocked,
          bannedFromChat: d.state.bannedFromChat ?? [],
        }));
      }
    } catch { /* noop */ }
  }

  async function kickFromLive(userId: string, name: string) {
    if (!confirm(`«${name}» از کلاس اخراج شود؟`)) return;
    try {
      const res = await fetch(`/api/live-signaling/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "kick", userId }),
      });
      if (res.ok) {
        setChatState(s => ({
          ...s,
          kickedFromLive: Array.from(new Set([...s.kickedFromLive, userId])),
        }));
      }
    } catch { /* noop */ }
  }

  if (!loaded) return <div className="card text-center py-12 text-muted text-sm">…</div>;
  if (!live) return (
    <div className="card text-center py-12">
      <p className="text-muted mb-4">کلاس یافت نشد.</p>
      <Link href="/teacher/live" className="btn-ghost">بازگشت</Link>
    </div>
  );

  const startMs = new Date(live.scheduledAt).getTime();
  const endMs = startMs + live.durationMin * 60 * 1000;
  const now = Date.now();
  const canEnter = now >= startMs && now <= endMs;

  if (!canEnter) {
    return (
      <div className="card text-center py-12 max-w-md mx-auto">
        <div className="text-4xl mb-3">⏰</div>
        <p className="text-muted mb-1">{now < startMs ? "اتاق هنوز باز نشده." : "کلاس تمام شده."}</p>
        <p className="text-xs text-muted mb-4">
          شروع: {formatIranDate(live.scheduledAt)} — {formatIranTime(live.scheduledAt)}
        </p>
        <Link href="/teacher/live" className="btn-ghost">بازگشت</Link>
      </div>
    );
  }

  const teacher = getTeacher(live.teacherId);
  const course = getCourse(live.courseId);

  // کاربران مسدود از چت
  const bannedUsers = Array.from(new Set(
    messages
      .filter(m => m.userRole === "student")
      .map(m => ({ userId: m.userId, userName: m.userName }))
      .filter(x => chatState.bannedFromChat.includes(x.userId))
      .map(x => `${x.userId}|${x.userName}`)
  )).map(s => {
    const [userId, userName] = s.split("|");
    return { userId, userName };
  });

  // کاربران اخراج‌شده
  const kickedUsers = Array.from(new Set(
    messages
      .filter(m => m.userRole === "student")
      .map(m => ({ userId: m.userId, userName: m.userName }))
      .filter(x => chatState.kickedFromLive.includes(x.userId))
      .map(x => `${x.userId}|${x.userName}`)
  )).map(s => {
    const [userId, userName] = s.split("|");
    return { userId, userName };
  });

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <Link href="/teacher/live" className="text-sm text-muted hover:text-lime inline-flex items-center gap-1">
        <ArrowRight className="w-3.5 h-3.5" /> بازگشت
      </Link>

      <header>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="chip text-[10px] border-danger/40 text-danger bg-danger/10">
            <Radio className="w-3 h-3 animate-pulse-soft" /> اتاق معلم
          </span>
          {course && <span className="chip text-[10px]">{course.subject}</span>}
        </div>
        <h1 className="h2">{live.title}</h1>
        <p className="text-sm text-muted mt-1">
          {teacher?.name} · {formatIranDate(live.scheduledAt)} — {formatIranTime(live.scheduledAt)}
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_380px] gap-4">
        <div className="space-y-3">
          {peerId ? (
            <LiveBroadcaster liveId={params.id} peerId={peerId} />
          ) : (
            <div className="card aspect-video flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-lime animate-spin" />
            </div>
          )}

          {/* کنترل چت */}
          <div className="card !p-3">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-lime" />
              <span className="font-bold text-sm">کنترل چت</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => updateState({ chatMode: chatState.chatMode === "public" ? "private" : "public" })}
                className={`p-3 rounded-xl2 border text-right transition ${
                  chatState.chatMode === "public" ? "bg-lime/10 border-lime/40" : "bg-violet/10 border-violet/40"
                }`}>
                {chatState.chatMode === "public" ? (
                  <>
                    <Globe className="w-4 h-4 text-lime mb-1" />
                    <div className="text-xs font-bold text-lime">عمومی</div>
                    <div className="text-[10px] text-muted mt-0.5">همه پیام‌ها را می‌بینند</div>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 text-violet mb-1" />
                    <div className="text-xs font-bold text-violet">خصوصی</div>
                    <div className="text-[10px] text-muted mt-0.5">هر کس فقط پیام خودش</div>
                  </>
                )}
              </button>
              <button onClick={() => updateState({ chatLocked: !chatState.chatLocked })}
                className={`p-3 rounded-xl2 border text-right transition ${
                  chatState.chatLocked ? "bg-danger/10 border-danger/40" : "bg-ok/10 border-ok/40"
                }`}>
                {chatState.chatLocked ? (
                  <>
                    <Lock className="w-4 h-4 text-danger mb-1" />
                    <div className="text-xs font-bold text-danger">قفل</div>
                    <div className="text-[10px] text-muted mt-0.5">دانش‌آموز نمی‌تواند بفرستد</div>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-ok mb-1" />
                    <div className="text-xs font-bold text-ok">باز</div>
                    <div className="text-[10px] text-muted mt-0.5">ارسال آزاد</div>
                  </>
                )}
              </button>
            </div>

            {/* لیست مسدودین چت */}
            {bannedUsers.length > 0 && (
              <div className="mt-3 pt-3 border-t border-line">
                <div className="text-xs text-muted mb-2 flex items-center gap-1">
                  <VolumeX className="w-3 h-3" /> مسدود از چت ({bannedUsers.length.toLocaleString("fa-IR")})
                </div>
                <div className="space-y-1">
                  {bannedUsers.map(u => (
                    <div key={u.userId} className="flex items-center gap-2 p-1.5 rounded bg-ink-3 text-xs">
                      <span className="flex-1 truncate">{u.userName}</span>
                      <button onClick={() => updateState({ unbanUser: u.userId })}
                        className="text-[10px] text-ok px-1.5 py-0.5 rounded hover:bg-ok/10 transition flex items-center gap-0.5">
                        <Volume2 className="w-3 h-3" /> رفع سکوت
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* لیست اخراج‌شده‌ها */}
            {kickedUsers.length > 0 && (
              <div className="mt-3 pt-3 border-t border-line">
                <div className="text-xs text-muted mb-2 flex items-center gap-1">
                  <UserX className="w-3 h-3" /> اخراج‌شده از کلاس ({kickedUsers.length.toLocaleString("fa-IR")})
                </div>
                <div className="space-y-1">
                  {kickedUsers.map(u => (
                    <div key={u.userId} className="flex items-center gap-2 p-1.5 rounded bg-danger/5 border border-danger/20 text-xs">
                      <span className="flex-1 truncate text-danger">{u.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* چت */}
        <div className="card flex flex-col max-h-[600px]">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <MessageSquare className="w-4 h-4 text-lime" />
            <h2 className="font-bold text-sm">چت</h2>
            <span className={`chip text-[10px] mr-auto ${
              chatState.chatMode === "public" ? "border-lime/40 text-lime" : "border-violet/40 text-violet"
            }`}>
              {chatState.chatMode === "public" ? "عمومی" : "خصوصی"}
            </span>
            {chatState.chatLocked && (
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
                const isBanned = chatState.bannedFromChat.includes(m.userId);
                return (
                  <div key={m.id} className={`text-sm ${isMe ? "text-left" : ""} group/msg relative`}>
                    <div className={`inline-block max-w-[85%] rounded-xl2 px-3 py-2 ${
                      isMe ? "bg-lime/15 border border-lime/20" :
                      isTeacher ? "bg-violet/10 border border-violet/20" :
                      isBanned ? "bg-danger/5 border border-danger/20" : "bg-ink-3"
                    }`}>
                      <div className="text-[10px] text-muted mb-0.5 flex items-center gap-1 flex-wrap">
                        {m.userName}
                        {isTeacher && <span className="text-violet"> · معلم</span>}
                        {isBanned && <span className="text-danger"> · سکوت</span>}
                        <span> · {new Date(m.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="text-paper/90 whitespace-pre-wrap">{m.text}</div>
                    </div>
                    {!isMe && !isTeacher && (
                      <div className="inline-flex gap-1 mr-1 opacity-0 group-hover/msg:opacity-100 transition align-top">
                        {!isBanned ? (
                          <button onClick={() => updateState({ banUser: m.userId })}
                            className="p-1 rounded text-amber hover:bg-amber/10 text-[10px]"
                            title="سکوت">
                            <VolumeX className="w-3 h-3" />
                          </button>
                        ) : (
                          <button onClick={() => updateState({ unbanUser: m.userId })}
                            className="p-1 rounded text-ok hover:bg-ok/10 text-[10px]"
                            title="رفع سکوت">
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => kickFromLive(m.userId, m.userName)}
                          className="p-1 rounded text-danger hover:bg-danger/10 text-[10px]"
                          title="اخراج از کلاس">
                          <UserX className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-line space-y-2">
            {chatState.chatLocked && (
              <p className="text-[11px] text-danger bg-danger/10 px-2 py-1.5 rounded-lg flex items-center gap-1">
                <Lock className="w-3 h-3" /> چت قفل است
              </p>
            )}
            {err && <p className="text-[11px] text-danger">{err}</p>}
            <div className="flex gap-2">
              <input className="input flex-1 py-2 text-sm" placeholder="پیام…"
                value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()} />
              <button onClick={send} disabled={!text.trim() || busy} className="btn-primary btn-sm">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}