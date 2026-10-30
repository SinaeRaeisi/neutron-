"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Calendar, Clock, Users, Trophy, Lock, CheckCheck, Play } from "lucide-react";
import { mockExams, gradeLabel } from "@/lib/data";
import type { Subscription, ExamRegistration, MockExamAttempt } from "@/lib/types";

interface Me {
  grade?: number; major?: string;
  subscription: Subscription | null;
}

export default function MockExamsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [regs, setRegs] = useState<ExamRegistration[]>([]);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const m = await fetch("/api/me").then(r => r.ok ? r.json() : null).catch(() => null);
    if (m) setMe(m);

    const r = await fetch("/api/me/registrations").then(x => x.ok ? x.json() : { regs: [] }).catch(() => ({ regs: [] }));
    setRegs(r.regs ?? []);

    const a = await fetch("/api/me/mock-attempts").then(x => x.ok ? x.json() : { attempts: [] }).catch(() => ({ attempts: [] }));
    const best: Record<string, number> = {};
    for (const at of (a.attempts ?? []) as MockExamAttempt[]) {
      if (!best[at.examId] || at.score > best[at.examId]) best[at.examId] = at.score;
    }
    setBestScores(best);
  }

  useEffect(() => { load(); }, []);

  async function register(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mock", id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "ثبت‌نام ناموفق."); return; }
      await load();
    } finally {
      setBusy(null);
    }
  }

  const hasSub = !!me?.subscription;

  // فیلتر سخت — فقط آزمون‌های پایه/رشتهٔ کاربر
const [serverExams, setServerExams] = useState<typeof mockExams>([]);
useEffect(() => {
  fetch("/api/mock-exams-admin")
    .then(r => r.ok ? r.json() : { exams: [] })
    .then(d => setServerExams(d.exams ?? []))
    .catch(() => {});
}, []);

const allExams = [...mockExams, ...serverExams];
const visible = allExams.filter(m => {
    if (me?.grade && m.grade !== me.grade) return false;
    if (me?.major && me.major !== "عمومی" && m.major !== me.major && m.major !== "عمومی") return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <header>
        <div className="chip border-amber/30 text-amber bg-amber/5 mb-3">
          <Trophy className="w-3 h-3" /> آزمون آزمایشی
        </div>
        <h1 className="h2">آزمون‌های آزمایشی</h1>
        <p className="text-muted text-sm mt-1">
          {hasSub
            ? "با اشتراک فعال، همهٔ آزمون‌های پایه و رشتهٔ تو رایگان است."
            : "برای شرکت در آزمون، اشتراک فعال لازم است."}
        </p>
      </header>

      {!hasSub && (
        <div className="card py-3 flex items-center justify-between flex-wrap gap-2 !rounded-xl2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Lock className="w-4 h-4" /> برای شرکت در آزمون‌ها اشتراک بگیر.
          </div>
          <Link href="/app/subscription" className="btn-primary btn-sm">خرید اشتراک</Link>
        </div>
      )}

      {visible.length === 0 && me?.grade && (
        <div className="card text-center py-12">
          <p className="text-muted">هنوز آزمونی برای پایهٔ تو تعریف نشده.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {visible.map(m => {
          const isRegistered = regs.some(r => r.examType === "mock" && r.examId === m.id);
          const best = bestScores[m.id];
          const dt = new Date(m.scheduledAt);
          const dateStr = dt.toLocaleDateString("fa-IR", { weekday: "long", month: "long", day: "numeric" });
          const timeStr = dt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
          const hasQuestions = !!m.questions && m.questions.length > 0;

          return (
            <div key={m.id} className="card card-hover flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="chip text-[10px]">پایهٔ {gradeLabel(m.grade)} · {m.major}</span>
                  <span className="chip text-[10px] border-lime/40 text-lime bg-lime/10">رایگان با اشتراک</span>
                </div>
                {best !== undefined && (
                  <div className="text-left shrink-0">
                    <div className="text-xs text-muted">بهترین نمره</div>
                    <div className="text-lg font-black text-lime num">{best}٪</div>
                  </div>
                )}
              </div>

              <h3 className="font-bold mb-2">{m.title}</h3>
              <p className="text-sm text-muted leading-relaxed mb-4">{m.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {m.subjects.map(s => <span key={s} className="chip text-[10px]">{s}</span>)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted mb-4">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{dateStr}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{timeStr} · {m.durationMin} دقیقه</span>
                <span className="flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" />{hasQuestions ? `${m.questions!.length} سؤال (نمونه)` : "—"}</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{m.registered.toLocaleString("fa-IR")} ثبت‌نام</span>
              </div>

              <div className="mt-auto">
                {!hasSub ? (
                  <Link href="/app/subscription" className="btn-ghost w-full text-sm">
                    <Lock className="w-4 h-4" /> خرید اشتراک
                  </Link>
                ) : !hasQuestions ? (
                  <button className="btn-ghost w-full text-sm" disabled>
                    سؤال‌ها به‌زودی
                  </button>
                ) : isRegistered ? (
                  <Link href={`/app/mock-exams/${m.id}`} className="btn-primary w-full text-sm">
                    <Play className="w-4 h-4" /> {best !== undefined ? "تلاش دوباره" : "شروع آزمون"}
                  </Link>
                ) : (
                  <button
                    onClick={() => register(m.id)}
                    disabled={busy === m.id}
                    className="btn-primary w-full text-sm">
                    <CheckCheck className="w-4 h-4" />
                    {busy === m.id ? "در حال ثبت‌نام…" : "ثبت‌نام رایگان"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}