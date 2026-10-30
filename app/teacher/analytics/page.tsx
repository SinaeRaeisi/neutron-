"use client";
import { useNeutronStore, getAttempts, getCustomQuizzes } from "@/lib/store";
import { quizzes as demoQuizzes } from "@/lib/data";

export default function Analytics() {
  const attempts = useNeutronStore(getAttempts, []);
  const custom   = useNeutronStore(getCustomQuizzes, []);
  const allQuizzes = [...demoQuizzes, ...custom];

  const byQuiz = allQuizzes.map(q => {
    const list = attempts.filter(a => a.quizId === q.id);
    const avg = list.length
      ? Math.round(list.reduce((s, a) => s + a.score, 0) / list.length)
      : 0;
    const gapMap = new Map<string, number>();
    list.forEach(a => a.gaps.forEach(g => gapMap.set(g, (gapMap.get(g) ?? 0) + 1)));
    return {
      quiz: q, count: list.length, avg,
      gaps: [...gapMap.entries()].sort((a, b) => b[1] - a[1]),
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">تحلیل کلاس</h1>
        <p className="text-muted text-sm mt-1">
          به تفکیک سنجش — بر اساس تلاش‌های ثبت‌شده.
        </p>
      </header>

      {byQuiz.map(({ quiz, count, avg, gaps }) => (
        <div key={quiz.id} className="card space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold">{quiz.title}</h2>
            <div className="text-xs text-muted">{count} تلاش</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-black tabular-nums text-lime">{avg}٪</div>
            <div className="flex-1 h-2 bg-ink-3 rounded-full overflow-hidden">
              <div className="h-full bg-lime transition-all" style={{ width: `${avg}%` }} />
            </div>
          </div>
          {gaps.length > 0 ? (
            <div>
              <div className="text-xs text-muted mb-2">مفاهیم ضعیف:</div>
              <div className="flex flex-wrap gap-1.5">
                {gaps.map(([c, n]) => (
                  <span key={c} className="chip border-danger/40 text-danger">
                    {c} · {n}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">تلاشی برای تحلیل ثبت نشده.</p>
          )}
        </div>
      ))}
    </div>
  );
}