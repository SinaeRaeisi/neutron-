"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowLeft, ArrowRight, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { addAttempt, uid } from "@/lib/store";
import { quizzes as demoQuizzes } from "@/lib/data";
import type { Quiz } from "@/lib/types";

export default function QuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [gaps, setGaps] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function load() {
      // ۱. اول دمو
      const demo = demoQuizzes.find(q => q.id === params.id);
      if (demo) {
        setQuiz(demo);
        setSecondsLeft(demo.durationMin * 60);
        setLoading(false);
        return;
      }
      // ۲. بعد سرور
      try {
        const r = await fetch(`/api/quizzes/${params.id}`);
        if (r.ok) {
          const d = await r.json();
          if (d?.quiz) {
            setQuiz(d.quiz);
            setSecondsLeft(d.quiz.durationMin * 60);
            setLoading(false);
            return;
          }
        }
      } catch { /* noop */ }
      setNotFound(true);
      setLoading(false);
    }
    load();
  }, [params.id]);

  useEffect(() => {
    if (!quiz || done || secondsLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [done, secondsLeft > 0, quiz?.id]); // eslint-disable-line

  if (loading) return <p className="card text-muted text-sm">در حال بارگذاری…</p>;
  if (notFound || !quiz) {
    return (
      <div className="card text-center py-12 max-w-md mx-auto">
        <p className="text-muted mb-2">این آزمون یافت نشد.</p>
        <p className="text-xs text-muted/70 mb-4">
          اگر معلم آزمون ساخته، مطمئن شو در دورهٔ درست ثبت شده و صفحه را رفرش کن.
        </p>
        <Link href="/app" className="btn-ghost">بازگشت به داشبورد</Link>
      </div>
    );
  }

  const total = quiz.questions.reduce((s, q) => s + q.weight, 0);
  const answered = Object.keys(answers).length;
  const current = quiz.questions[idx];
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const timeWarn = secondsLeft < 60;

  async function submit() {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "ثبت ناموفق بود.");
        setSubmitting(false);
        return;
      }
      const result = await res.json();
      setScore(result.score);
      setGaps(result.gaps);
      setDone(true);
      addAttempt({
        id: uid(), quizId: quiz.id, userId: "server",
        answers, score: result.score, gaps: result.gaps,
        takenAt: result.submittedAt,
      });
    } catch {
      alert("خطای شبکه.");
      setSubmitting(false);
    }
  }

  if (done) {
    const uniqueGaps = [...new Set(gaps)];
    const correctCount = quiz.questions.length - gaps.length;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl mx-auto">
        <div className="card text-center py-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-40" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-lime glow-lime mb-4">
              <div className="text-3xl font-black text-lime num">{score}٪</div>
            </div>
            <h1 className="h2 mb-2">
              {score >= 70 ? "عالی بود! 🎉" : score >= 40 ? "خوب بود 👏" : "نیاز به مرور 💪"}
            </h1>
            <p className="text-muted">{correctCount} از {quiz.questions.length} درست</p>
          </div>
        </div>
        {uniqueGaps.length > 0 && (
          <div className="card">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber" /> مسیر جبرانی
            </h2>
            <ul className="space-y-2">
              {uniqueGaps.map(c => (
                <li key={c} className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-danger shrink-0" />
                  <span>مرور مفهوم <b className="text-paper">{c}</b></span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3">
          <Link href="/app" className="btn-primary flex-1 text-center">بازگشت</Link>
          <button onClick={() => router.refresh()} className="btn-ghost flex-1">تلاش دوباره</button>
        </div>
      </motion.div>
    );
  }

  const isLast = idx === quiz.questions.length - 1;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="card py-3.5 flex items-center justify-between gap-3 !rounded-xl2 sticky top-16 md:top-20 z-20">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-sm font-bold num ${timeWarn ? "text-danger animate-pulse-soft" : ""}`}>
            <Clock className="w-4 h-4" />{mm}:{ss}
          </div>
          <div className="h-5 w-px bg-line" />
          <div className="text-xs text-muted">سؤال {idx + 1} از {quiz.questions.length}</div>
        </div>
        <div className="text-xs text-muted">{answered} / {quiz.questions.length}</div>
      </div>

      <div className="h-1 bg-ink-3 rounded-full overflow-hidden">
        <motion.div animate={{ width: `${((idx + 1) / quiz.questions.length) * 100}%` }} className="h-full bg-lime" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current.id}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
          className="card p-6">
          <div className="text-xs text-lime mb-2">سؤال {idx + 1}</div>
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
                  }`}>{chosen ? "✓" : oi + 1}</div>
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
          <button onClick={submit} disabled={answered < quiz.questions.length || submitting} className="btn-primary flex-[2]">
            {submitting ? "در حال ثبت…" : "ثبت نهایی"} <CheckCircle2 className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setIdx(i => Math.min(quiz.questions.length - 1, i + 1))} className="btn-soft flex-[2]">
            بعدی <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}