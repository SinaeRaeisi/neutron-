"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock, Crown } from "lucide-react";
import {
  ArrowRight, ThumbsUp, CheckCircle2, Send, Clock,
  BookOpen, AlertCircle, Trash2, Check, X, ChevronDown,
} from "lucide-react";
import { getCourse } from "@/lib/data";
import type { QandAQuestion, QandAAnswer } from "@/lib/types";

interface Me {
  id: string;
  name: string;
  role: string;
  subscription?: { expiresAt: string } | null;  // ← جدید
}

const statusMeta = {
  open:     { text: "بدون پاسخ", color: "border-amber/40 text-amber bg-amber/10" },
  answered: { text: "پاسخ داده", color: "border-sky/40 text-sky bg-sky/10" },
  resolved: { text: "حل شده", color: "border-ok/40 text-ok bg-ok/10" },
} as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "همین الان";
  if (min < 60) return `${min.toLocaleString("fa-IR")} دقیقه پیش`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h.toLocaleString("fa-IR")} ساعت پیش`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d.toLocaleString("fa-IR")} روز پیش`;
  return new Date(iso).toLocaleDateString("fa-IR");
}

export default function QuestionPage({ params }: { params: { id: string } }) {
  const [me, setMe] = useState<Me | null>(null);
  const [question, setQuestion] = useState<QandAQuestion | null>(null);
  const [answers, setAnswers] = useState<QandAAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const [meRes, qRes, aRes] = await Promise.all([
        fetch("/api/me").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/qanda").then(r => r.ok ? r.json() : { questions: [] }).catch(() => ({ questions: [] })),
        fetch(`/api/qanda/${params.id}/answers`).then(r => r.ok ? r.json() : { answers: [] }).catch(() => ({ answers: [] })),
      ]);
      setMe(meRes);
      const found = (qRes.questions as QandAQuestion[]).find(q => q.id === params.id);
      if (!found) { setNotFound(true); setLoading(false); return; }
      setQuestion(found);
      setAnswers(aRes.answers ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [params.id]);

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/qanda/${params.id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "ثبت ناموفق."); return; }
      setBody("");
      await load();
    } catch { setErr("خطای شبکه."); }
    finally { setBusy(false); }
  }

  async function voteAnswer(answerId: string) {
    try {
      await fetch(`/api/qanda/${params.id}/answers/${answerId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote" }),
      });
      await load();
    } catch { /* */ }
  }

  async function acceptAnswer(answerId: string) {
    try {
      await fetch(`/api/qanda/${params.id}/answers/${answerId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      await load();
    } catch { /* */ }
  }

  async function unacceptAnswer(answerId: string) {
    try {
      await fetch(`/api/qanda/${params.id}/answers/${answerId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unaccept" }),
      });
      await load();
    } catch { /* */ }
  }

  async function deleteQuestion() {
    if (!confirm("این سؤال و همهٔ پاسخ‌هایش حذف شود؟")) return;
    try {
      const res = await fetch(`/api/qanda/${params.id}`, { method: "DELETE" });
      if (res.ok) window.location.href = "/app/qanda";
      else alert("حذف ناموفق.");
    } catch { /* */ }
  }

  if (loading) return <div className="card text-center py-12 text-muted text-sm">…</div>;
  if (notFound || !question) return (
    <div className="card text-center py-12">
      <p className="text-muted mb-4">سؤال یافت نشد.</p>
      <Link href="/app/qanda" className="btn-ghost">بازگشت</Link>
    </div>
  );
const hasSub = !!me?.subscription;
const isStaff = me?.role === "teacher" || me?.role === "admin";
const canAccess = hasSub || isStaff;

  const st = statusMeta[question.status];
  const course = question.courseId ? getCourse(question.courseId) : null;
  const isOwner = me?.id === question.userId;
  const isAdmin = me?.role === "admin";
  const canAccept = isOwner || isAdmin;
if (!canAccess) {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Link href="/app/qanda" className="text-sm text-muted hover:text-lime inline-flex items-center gap-1">
        <ArrowRight className="w-3.5 h-3.5" /> همهٔ سؤال‌ها
      </Link>

      <div className="card">
        <h1 className="text-xl font-bold mb-2">{question.title}</h1>
        <p className="text-sm text-muted leading-relaxed">{question.body}</p>
      </div>

      <div className="card border-lime/40 bg-gradient-to-l from-lime/10 to-transparent text-center py-10">
        <div className="w-14 h-14 rounded-full bg-lime/20 border border-lime/40 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-lime" />
        </div>
        <h2 className="h3 mb-2">پاسخ‌ها قفل است</h2>
        <p className="text-sm text-muted mb-5 max-w-sm mx-auto">
          برای دیدن پاسخ‌های معلم‌ها و هم‌کلاسی‌ها، اشتراک فعال کن.
        </p>
        <Link href="/app/subscription" className="btn-primary inline-flex">
          <Crown className="w-4 h-4" /> خرید اشتراک
        </Link>
      </div>
    </div>
  );
}

  const sorted = [...answers].sort((a, b) => {
    if (question.acceptedAnswerId === a.id) return -1;
    if (question.acceptedAnswerId === b.id) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Link href="/app/qanda" className="text-sm text-muted hover:text-lime inline-flex items-center gap-1">
        <ArrowRight className="w-3.5 h-3.5" /> همهٔ سؤال‌ها
      </Link>

      {/* Question */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`chip text-[10px] ${st.color}`}>{st.text}</span>
          {question.userRole === "teacher" && (
            <span className="chip text-[10px] border-lime/40 text-lime">معلم</span>
          )}
          {course && (
            <span className="chip text-[10px] flex items-center gap-1">
              <BookOpen className="w-3 h-3" />{course.title}
            </span>
          )}
          {(isOwner || isAdmin) && (
            <button onClick={deleteQuestion} className="mr-auto text-danger hover:bg-danger/10 rounded p-1.5">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <h1 className="text-xl md:text-2xl font-black mb-3">{question.title}</h1>
        <p className="text-paper/90 text-sm leading-loose whitespace-pre-wrap">{question.body}</p>

        {question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {question.tags.map(t => <span key={t} className="chip text-[10px]">{t}</span>)}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-line/60 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-muted">
            <div className="w-6 h-6 rounded-full bg-ink-3 flex items-center justify-center text-[10px] font-bold">
              {question.userName[0]}
            </div>
            <span>{question.userName}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(question.createdAt)}</span>
          </div>
          <button onClick={() => voteAnswer("") /* not used */} hidden />
        </div>
      </div>

      {/* Answers */}
      <div>
        <h2 className="font-bold text-sm mb-2 px-1">
          {answers.length === 0 ? "هنوز پاسخی نیست" : `${answers.length.toLocaleString("fa-IR")} پاسخ`}
        </h2>

        {sorted.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-muted text-sm">اولین کسی باش که پاسخ می‌دهد.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map(a => {
              const isAccepted = question.acceptedAnswerId === a.id;
              const voted = me?.id ? a.upvotedBy.includes(me.id) : false;
              const isTeacherAnswer = a.userRole === "teacher";
              return (
                <div key={a.id}
                  className={`card ${isAccepted ? "!border-ok/50 !bg-ok/5" : isTeacherAnswer ? "!border-lime/30" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isTeacherAnswer ? "bg-lime/20 text-lime" : "bg-ink-3"
                    }`}>
                      {a.userName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium">{a.userName}</span>
                        {isTeacherAnswer && (
                          <span className="chip text-[10px] border-lime/40 text-lime">معلم</span>
                        )}
                        {isAccepted && (
                          <span className="chip text-[10px] border-ok/40 text-ok bg-ok/10">
                            <Check className="w-3 h-3" /> پاسخ برتر
                          </span>
                        )}
                        <span className="text-xs text-muted">· {timeAgo(a.createdAt)}</span>
                      </div>
                      <p className="text-sm leading-loose whitespace-pre-wrap text-paper/90 mt-2">{a.body}</p>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <button onClick={() => voteAnswer(a.id)}
                          className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition ${
                            voted ? "bg-lime/15 text-lime" : "text-muted hover:bg-ink-3"
                          }`}>
                          <ThumbsUp className="w-3 h-3" />
                          {a.upvotedBy.length > 0 ? a.upvotedBy.length.toLocaleString("fa-IR") : "مفید بود"}
                        </button>

                        {canAccept && question.status !== "resolved" && (
                          <button onClick={() => acceptAnswer(a.id)}
                            className="text-xs flex items-center gap-1 px-2 py-1 rounded text-ok hover:bg-ok/10 transition">
                            <CheckCircle2 className="w-3 h-3" /> قبول به‌عنوان پاسخ
                          </button>
                        )}
                        {canAccept && isAccepted && (
                          <button onClick={() => unacceptAnswer(a.id)}
                            className="text-xs flex items-center gap-1 px-2 py-1 rounded text-muted hover:bg-ink-3 transition">
                            <X className="w-3 h-3" /> لغو پاسخ برتر
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply form */}
      <form onSubmit={submitAnswer} className="card space-y-2">
        <label className="label">پاسخ تو</label>
        <textarea className="input min-h-[100px]" value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="پاسخ یا راهنمایی خودت را بنویس…" />
        {err && (
          <p className="text-danger text-sm flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> {err}
          </p>
        )}
        <button className="btn-primary w-full" disabled={busy || !body.trim()}>
          {busy ? "…" : <><Send className="w-4 h-4" /> ارسال پاسخ</>}
        </button>
      </form>
    </div>
  );
}