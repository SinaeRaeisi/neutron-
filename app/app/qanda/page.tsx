"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LifeBuoy, Plus, Search, CheckCircle2, ThumbsUp, X, Clock,
  BookOpen, Send, AlertCircle, Lock, Crown,
} from "lucide-react";
import { courses as seedCourses, getCourse } from "@/lib/data";
import type { QandAQuestion, Course, Subscription } from "@/lib/types";

interface Me {
  name: string;
  role: string;
  grade?: number;
  major?: string;
  subscription: Subscription | null;
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

const emptyForm = { title: "", body: "", courseId: "", tagsRaw: "" };

export default function QandAPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [questions, setQuestions] = useState<QandAQuestion[]>([]);
  const [courses, setCourses] = useState<Course[]>(seedCourses);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "answered" | "resolved">("all");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const [qRes, cRes, meRes] = await Promise.all([
        fetch("/api/qanda").then(r => r.ok ? r.json() : { questions: [] }).catch(() => ({ questions: [] })),
        fetch("/api/courses").then(r => r.ok ? r.json() : { courses: [] }).catch(() => ({ courses: [] })),
        fetch("/api/me").then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      setQuestions(qRes.questions ?? []);
      if (cRes.courses?.length) setCourses(cRes.courses);
      setMe(meRes);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const hasSub = !!me?.subscription;
  const isStaff = me?.role === "teacher" || me?.role === "admin";
  const canAccess = hasSub || isStaff;

  const myCourses = useMemo(() => {
    if (!me?.grade) return courses;
    return courses.filter(c => {
      if (c.grade !== me.grade) return false;
      if (me.major && me.major !== "عمومی" && c.major && c.major !== me.major && c.major !== "عمومی") return false;
      return true;
    });
  }, [courses, me]);

  const filtered = useMemo(() => questions.filter(qz => {
    if (filter !== "all" && qz.status !== filter) return false;
    if (q && !qz.title.includes(q) && !qz.body.includes(q)) return false;
    return true;
  }), [questions, filter, q]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.title.trim() || !form.body.trim()) { setErr("عنوان و متن سؤال لازم است."); return; }
    setBusy(true);
    try {
      const tags = form.tagsRaw.split(/[,،]/).map(t => t.trim()).filter(Boolean);
      const res = await fetch("/api/qanda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          courseId: form.courseId || undefined,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "ثبت ناموفق."); return; }
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch { setErr("خطای شبکه."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="chip border-violet/30 text-violet bg-violet/5 mb-3">
            <LifeBuoy className="w-3 h-3" /> رفع اشکال
          </div>
          <h1 className="h2">رفع اشکال</h1>
          <p className="text-muted text-sm mt-1">
            سؤالت را بپرس، معلم‌ها و هم‌کلاسی‌ها جواب می‌دهند.
          </p>
        </div>
        {!showForm && canAccess && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> سؤال بپرس
          </button>
        )}
      </header>

      {/* قفل اشتراک */}
      {!canAccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card border-lime/40 bg-gradient-to-l from-lime/10 to-transparent"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl2 bg-lime/20 border border-lime/40 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-lime" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold mb-1">رفع اشکال مخصوص مشترکین</h3>
              <p className="text-sm text-muted leading-relaxed mb-3">
                برای پرسیدن سؤال، پاسخ دادن، و دیدن پاسخ‌های معلم‌ها، اشتراک فعال کن.
                با اشتراک، به کل تیم آموزشی نوترون دسترسی داری.
              </p>
              <Link href="/app/subscription" className="btn-primary btn-sm inline-flex">
                <Crown className="w-3.5 h-3.5" /> خرید اشتراک
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {showForm && canAccess && (
        <motion.form
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={submit}
          className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">سؤال جدید</h2>
            <button type="button" onClick={() => { setShowForm(false); setErr(null); }} className="p-1 hover:bg-ink-3 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="label">عنوان</label>
            <input className="input" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="مثلاً: چرا دلتای این معادله منفی است؟" />
          </div>

          <div>
            <label className="label">توضیح کامل</label>
            <textarea className="input min-h-[120px]" value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="مشکلت را دقیق بنویس — بهتر می‌توانیم کمک کنیم." />
          </div>

          <div className="grid md:grid-cols-2 gap-2">
            <div>
              <label className="label">دوره (اختیاری)</label>
              <select className="input" value={form.courseId}
                onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
                <option value="">بدون دوره خاص</option>
                {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">برچسب‌ها (با کاما)</label>
              <input className="input" value={form.tagsRaw}
                onChange={e => setForm(f => ({ ...f, tagsRaw: e.target.value }))}
                placeholder="ریاضی، دلتا" />
            </div>
          </div>

          {err && (
            <p className="text-danger text-sm flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {err}
            </p>
          )}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "…" : <><Send className="w-4 h-4" /> ثبت سؤال</>}
          </button>
        </motion.form>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {[
          { k: "all", label: "همه" },
          { k: "open", label: "بدون پاسخ" },
          { k: "answered", label: "پاسخ داده" },
          { k: "resolved", label: "حل شده" },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k as typeof filter)}
            className={`chip transition ${filter === f.k ? "bg-lime text-ink border-lime" : ""}`}>
            {f.label}
            <span className="text-[10px] opacity-70">
              ({f.k === "all" ? questions.length : questions.filter(qz => qz.status === f.k).length})
            </span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
        <input className="input pr-10" placeholder="جست‌وجو در سؤال‌ها…" value={q}
          onChange={e => setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="card text-center py-8 text-muted text-sm">…</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <LifeBuoy className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted mb-2">
            {questions.length === 0 ? "هنوز سؤالی ثبت نشده. اولین نفر باش!" : "سؤالی با این فیلتر نیست."}
          </p>
          {questions.length === 0 && !showForm && canAccess && (
            <button onClick={() => setShowForm(true)} className="btn-primary btn-sm mt-2">
              <Plus className="w-3.5 h-3.5" /> اولین سؤال
            </button>
          )}
        </div>
      ) : (
        <div className={`space-y-2 ${!canAccess ? "relative" : ""}`}>
          {!canAccess && (
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-ink/40 to-ink/90 rounded-2xl flex items-end justify-center pb-12">
              <div className="text-center">
                <Lock className="w-8 h-8 text-lime mx-auto mb-2" />
                <p className="text-sm text-paper font-medium mb-3">پاسخ‌های معلم‌ها قفل است</p>
                <Link href="/app/subscription" className="btn-primary btn-sm">
                  <Crown className="w-3.5 h-3.5" /> خرید اشتراک
                </Link>
              </div>
            </div>
          )}
          <div className={!canAccess ? "pointer-events-none select-none" : ""}>
            {filtered.map(qz => {
              const st = statusMeta[qz.status];
              const course = qz.courseId ? getCourse(qz.courseId) : null;
              return (
                <Link key={qz.id} href={`/app/qanda/${qz.id}`}
                  className="card card-hover block group mb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-ink-3 flex items-center justify-center text-xs font-bold shrink-0">
                      {qz.userName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`chip text-[10px] ${st.color}`}>{st.text}</span>
                        {qz.userRole === "teacher" && (
                          <span className="chip text-[10px] border-lime/40 text-lime">معلم</span>
                        )}
                        {course && (
                          <span className="chip text-[10px] flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {course.title.length > 25 ? course.title.slice(0, 25) + "…" : course.title}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm group-hover:text-lime transition line-clamp-1">
                        {qz.title}
                      </h3>
                      <p className="text-xs text-muted mt-1 line-clamp-2">{qz.body}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted flex-wrap">
                        <span>{qz.userName}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(qz.createdAt)}</span>
                        {qz.upvotedBy.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{qz.upvotedBy.length.toLocaleString("fa-IR")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {qz.status === "resolved" && (
                      <CheckCircle2 className="w-5 h-5 text-ok shrink-0" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}