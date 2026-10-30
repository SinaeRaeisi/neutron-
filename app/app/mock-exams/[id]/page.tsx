"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowLeft, ArrowRight, CheckCircle2, Trophy, Medal, Lock } from "lucide-react";
import { gradeLabel } from "@/lib/data";
import { formatIranDate, formatIranTime, remainingText } from "@/lib/iran-time";
import type { MockExam } from "@/lib/types";

type Phase = "intro" | "taking" | "result";
interface Saved {
  phase: Phase;
  answers: Record<string, number>;
  idx: number;
  secondsLeft: number;
  savedAt: number;
}
interface LeaderRow { userId: string; name: string; best: number; attempts: number; }
interface Me { subscription?: unknown; name?: string; }

export default function MockExamPage({ params }: { params: { id: string } }) {
  const [exam, setExam] = useState<MockExam | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const storageKey = `neutron.mockexam.${params.id}.state`;

  // ۱. بارگذاری آزمون: اول دمو، بعد سرور
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/mock-exams-admin");
        if (r.ok) {
          const d = await r.json();
          const found = (d.exams as MockExam[]).find(m => m.id === params.id);
          if (found) {
            setExam(found);
            setLoading(false);
            return;
          }
        }
      } catch { /* noop */ }
      setNotFound(true);
      setLoading(false);
    }
    load();

    // بارگذاری user + ثبت‌نام
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(setMe).catch(() => {});
    fetch("/api/me/registrations").then(r => r.ok ? r.json() : { regs: [] })
      .then(d => {
        const regs = d.regs ?? [];
        setRegistered(regs.some((x: any) => x.examType === "mock" && x.examId === params.id));
      }).catch(() => {});
  }, [params.id]);

  // ۲. بازیابی state آزمون
  useEffect(() => {
    if (!exam || !exam.questions || exam.questions.length === 0) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const s: Saved = JSON.parse(raw);
        if (s.phase === "taking") {
          const elapsed = Math.floor((Date.now() - s.savedAt) / 1000);
          const remaining = Math.max(0, s.secondsLeft - elapsed);
          setPhase("taking");
          setIdx(s.idx);
          setAnswers(s.answers);
          setSecondsLeft(remaining);
        }
      }
    } catch { /* noop */ }
  }, [storageKey, exam?.id]);

  // ۳. ذخیره state
  useEffect(() => {
    if (!exam) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        phase, answers, idx, secondsLeft, savedAt: Date.now(),
      }));
    } catch { /* noop */ }
  }, [phase, answers, idx, secondsLeft, storageKey, exam?.id]);

  // ۴. تایمر
  useEffect(() => {
    if (phase !== "taking" || secondsLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, secondsLeft > 0]); // eslint-disable-line

  // ۵. نفرات برتر
  useEffect(() => {
    if (phase !== "result" || !exam) return;
    fetch(`/api/mock-exams/${exam.id}/leaderboard`)
      .then(r => r.ok ? r.json() : { leaderboard: [] })
      .then(d => setLeaderboard(d.leaderboard ?? []))
      .catch(() => {});
  }, [phase, exam?.id]);

  if (loading) return <p className="card text-muted text-sm text-center py-12">در حال بارگذاری…</p>;

  if (notFound || !exam || !exam.questions || exam.questions.length === 0) {
    return (
      <div className="card text-center py-12 max-w-md mx-auto">
        <p className="text-muted mb-2">این آزمون در دسترس نیست.</p>
        <p className="text-xs text-muted/70 mb-4">
          اگر همین الان ساخته شده، صفحه را رفرش کن.
        </p>
        <Link href="/app/mock-exams" className="btn-ghost">بازگشت</Link>
      </div>
    );
  }

  const questions = exam.questions;
  const hasSub = !!me?.subscription;
  const startMs = new Date(exam.scheduledAt).getTime();
  const endMs = startMs + exam.durationMin * 60 * 1000;
  const now = Date.now();
  const isOpen = now >= startMs - 15 * 60 * 1000 && now <= endMs;
  const isPast = now > endMs;

  async function register() {
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mock", id: exam!.id }),
      });
      if (res.ok) setRegistered(true);
      else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "ثبت‌نام ناموفق.");
      }
    } finally { setBusy(false); }
  }

  function start() {
    if (!exam) return;
    setPhase("taking");
    setSecondsLeft(exam.durationMin * 60);
    setIdx(0);
    setAnswers({});
    setResult(null);
  }

  async function submit() {
    if (!exam) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/mock-exams/${exam.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "ثبت ناموفق."); return; }
      setResult({ score: data.attempt.score, correct: data.correct, total: data.total });
      setPhase("result");
      try { localStorage.removeItem(storageKey); } catch { /* noop */ }
    } finally { setBusy(false); }
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const answered = Object.keys(answers).length;

  // ─── Intro ───
  if (phase === "intro") {
    return (
      <div className="card text-center py-10 max-w-xl mx-auto space-y-4">
        <div className="text-xs text-muted">
          {gradeLabel(exam.grade)} · {exam.major}
        </div>
        <h1 className="h2">{exam.title}</h1>
        <p className="text-muted">{exam.description}</p>

        <div className="flex items-center justify-center gap-5 text-sm text-muted flex-wrap">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />{exam.durationMin.toLocaleString("fa-IR")} دقیقه
          </span>
          <span>{questions.length.toLocaleString("fa-IR")} سؤال</span>
        </div>

        <div className="card !bg-ink-3 text-xs text-muted max-w-sm mx-auto text-right">
          <div className="mb-1.5"><b className="text-paper">زمان شروع:</b> {formatIranDate(exam.scheduledAt)} — {formatIranTime(exam.scheduledAt)}</div>
          <div className="mb-2">
            {isPast ? (
              <span className="text-muted">این آزمون تمام شده است.</span>
            ) : isOpen ? (
              <span className="text-danger">الان می‌توانی شرکت کنی.</span>
            ) : (
              <span className="text-sky">باقی‌مانده تا شروع: {remainingText(exam.scheduledAt)}</span>
            )}
          </div>
        </div>

        {!hasSub ? (
          <div className="card !bg-amber/10 border-amber/30 text-sm text-amber max-w-sm mx-auto">
            <Lock className="w-4 h-4 inline ml-1" />
            برای شرکت، اشتراک فعال لازم است.
          </div>
        ) : isPast ? (
          <p className="text-sm text-muted">این آزمون به پایان رسیده.</p>
        ) : !isOpen ? (
          <p className="text-sm text-muted">هنوز زمان آزمون نشده.</p>
        ) : !registered ? (
          <button onClick={register} disabled={busy} className="btn-primary">
            {busy ? "…" : "ثبت‌نام رایگان"}
          </button>
        ) : (
          <button onClick={start} className="btn-primary">شروع آزمون</button>
        )}

        <Link href="/app/mock-exams" className="block text-xs text-muted hover:text-lime">
          بازگشت به لیست
        </Link>
      </div>
    );
  }

  // ─── Result ───
  if (phase === "result" && result) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl mx-auto">
        <div className="card text-center py-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-lime glow-lime mb-4">
            <div className="text-3xl font-black text-lime num">{result.score}٪</div>
          </div>
          <h1 className="h2 mb-2">
            {result.score >= 70 ? "عالی! 🎉" : result.score >= 40 ? "قابل قبول 👏" : "نیاز به تلاش 💪"}
          </h1>
          <p className="text-muted">{result.correct.toLocaleString("fa-IR")} از {result.total.toLocaleString("fa-IR")} درست</p>
        </div>

        {leaderboard.length > 0 && (
          <div className="card">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber" /> نفرات برتر
            </h2>
            <div className="space-y-1.5">
              {leaderboard.slice(0, 10).map((r, i) => (
                <div key={r.userId} className={`flex items-center gap-3 text-sm p-2 rounded-lg ${
                  i < 3 ? "bg-ink-3/50" : ""
                }`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? "bg-amber text-ink" :
                    i === 1 ? "bg-gray-300 text-ink" :
                    i === 2 ? "bg-amber-700/80 text-paper" :
                    "bg-ink-3 text-muted"
                  }`}>
                    {i < 3 ? <Medal className="w-3.5 h-3.5" /> : (i + 1).toLocaleString("fa-IR")}
                  </span>
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="text-xs text-muted">({r.attempts.toLocaleString("fa-IR")} تلاش)</span>
                  <span className="font-bold text-lime tabular-nums shrink-0">{r.best}٪</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/app/mock-exams" className="btn-primary flex-1 text-center">بازگشت</Link>
          <button onClick={start} className="btn-ghost flex-1">تلاش دوباره</button>
        </div>
      </motion.div>
    );
  }

  // ─── Taking ───
  const current = questions[idx];
  const isLast = idx === questions.length - 1;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="card py-3.5 flex items-center justify-between gap-3 !rounded-xl2 sticky top-16 md:top-20 z-20">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-sm font-bold num ${secondsLeft < 60 ? "text-danger" : ""}`}>
            <Clock className="w-4 h-4" />{mm}:{ss}
          </div>
          <div className="h-5 w-px bg-line" />
          <div className="text-xs text-muted">
            سؤال {(idx + 1).toLocaleString("fa-IR")} از {questions.length.toLocaleString("fa-IR")}
          </div>
        </div>
        <div className="text-xs text-muted">
          {answered.toLocaleString("fa-IR")} / {questions.length.toLocaleString("fa-IR")}
        </div>
      </div>

      <div className="h-1 bg-ink-3 rounded-full overflow-hidden">
        <motion.div animate={{ width: `${((idx + 1) / questions.length) * 100}%` }} className="h-full bg-lime" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current.id}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
          className="card p-6">
          <div className="text-xs text-lime mb-2">سؤال {(idx + 1).toLocaleString("fa-IR")}</div>
          <h2 className="text-lg font-bold mb-5 leading-relaxed">{current.prompt}</h2>
          <div className="grid gap-2">
            {current.options.map((o, oi) => {
              const chosen = answers[current.id] === oi;
              return (
                <button key={oi}
                  onClick={() => setAnswers(a => ({ ...a, [current.id]: oi }))}
                  className={`text-right p-3.5 rounded-xl2 border-2 transition flex items-center gap-3 ${
                    chosen ? "border-lime bg-lime/10" : "border-line hover:bg-ink-3"
                  }`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                    chosen ? "border-lime bg-lime text-ink" : "border-line text-muted"
                  }`}>{chosen ? "✓" : (oi + 1).toLocaleString("fa-IR")}</div>
                  <span className="text-sm">{o}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2">
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="btn-ghost flex-1">
          <ArrowRight className="w-4 h-4" /> قبلی
        </button>
        {isLast ? (
          <button onClick={submit} disabled={busy || answered < questions.length} className="btn-primary flex-[2]">
            {busy ? "…" : "ثبت نهایی"} <CheckCircle2 className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setIdx(i => Math.min(questions.length - 1, i + 1))} className="btn-soft flex-[2]">
            بعدی <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}