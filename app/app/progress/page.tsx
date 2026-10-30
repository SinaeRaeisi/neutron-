"use client";
import { motion } from "framer-motion";
import { TrendingUp, Target, Award, AlertTriangle } from "lucide-react";
import { useNeutronStore, getAttempts, getCustomQuizzes } from "@/lib/store";
import { quizzes as demoQuizzes, concepts } from "@/lib/data";

export default function Progress() {
  const attempts = useNeutronStore(getAttempts, []);
  const custom   = useNeutronStore(getCustomQuizzes, []);
  const allQuizzes = [...demoQuizzes, ...custom];

  const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const best = attempts.reduce((m, a) => Math.max(m, a.score), 0);
  const gapCounts = new Map<string, number>();
  attempts.forEach(a => a.gaps.forEach(g => gapCounts.set(g, (gapCounts.get(g) ?? 0) + 1)));
  const topGaps = [...gapCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // روند ۵ آزمون اخیر (از قدیم به جدید)
  const recent = [...attempts].slice(0, 8).reverse();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h2">پیشرفت</h1>
        <p className="text-muted text-sm mt-1">نمای کلی از سفر یادگیری تو.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { Icon: TrendingUp, label: "میانگین", val: `${avg}٪`, color: "text-lime" },
          { Icon: Target,     label: "بهترین", val: `${best}٪`, color: "text-ok" },
          { Icon: Award,      label: "سنجش‌ها", val: attempts.length, color: "text-sky" },
          { Icon: AlertTriangle, label: "شکاف‌ها", val: gapCounts.size, color: "text-danger" },
        ].map(s => (
          <div key={s.label} className="card">
            <s.Icon className={`w-4 h-4 mb-2 ${s.color}`} />
            <div className="text-xs text-muted">{s.label}</div>
            <div className={`text-2xl font-black num mt-0.5 ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {attempts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted">هنوز سنجشی ثبت نکرده‌ای. با اولین آزمون شروع کن.</p>
        </div>
      ) : (
        <>
          {/* نمودار روند */}
          <section className="card">
            <h3 className="font-bold mb-4">روند نمرات</h3>
            <div className="h-40 flex items-end gap-2">
              {recent.map((a, i) => (
                <div key={a.id} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-[10px] text-muted num">{a.score}٪</div>
                  <div className="flex-1 w-full flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${a.score}%` }}
                      transition={{ delay: i * 0.08, duration: 0.6 }}
                      className={`w-full rounded-t-lg ${
                        a.score >= 70 ? "bg-ok" : a.score >= 40 ? "bg-lime" : "bg-danger"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* شکاف‌ها */}
          {topGaps.length > 0 && (
            <section className="card">
              <h3 className="font-bold mb-3">شکاف‌های پرتکرار</h3>
              <div className="space-y-2">
                {topGaps.map(([cid, count]) => {
                  const concept = concepts.find(c => c.id === cid);
                  return (
                    <div key={cid} className="flex items-center gap-3">
                      <span className="chip border-danger/40 text-danger shrink-0">{cid}</span>
                      <span className="text-sm flex-1">{concept?.title ?? cid}</span>
                      <div className="flex-1 max-w-[120px] h-1.5 bg-ink-3 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / topGaps[0][1]) * 100}%` }}
                          className="h-full bg-danger"
                        />
                      </div>
                      <span className="text-xs text-muted num">{count}×</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* تاریخچه */}
          <section>
            <h3 className="font-bold mb-3">تاریخچه</h3>
            <div className="space-y-2">
              {attempts.map(a => {
                const q = allQuizzes.find(x => x.id === a.quizId);
                return (
                  <div key={a.id} className="card flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-medium text-sm">{q?.title ?? a.quizId}</div>
                      <div className="text-xs text-muted mt-0.5">
                        {new Date(a.takenAt).toLocaleString("fa-IR")}
                      </div>
                    </div>
                    <div className={`text-xl font-black num ${
                      a.score >= 70 ? "text-ok" : a.score >= 40 ? "text-lime" : "text-danger"
                    }`}>{a.score}٪</div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}