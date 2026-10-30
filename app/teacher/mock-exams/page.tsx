"use client";
import { useEffect, useState } from "react";
import { Trophy, Users, Medal, TrendingUp } from "lucide-react";
import { formatIranDate, formatIranTime } from "@/lib/iran-time";
import { gradeLabel } from "@/lib/data";

interface Row { userId: string; name: string; best: number; attempts: number; }
interface ExamData {
  exam: { id: string; title: string; grade: number; major: string; scheduledAt: string; questionCount: number };
  totalParticipants: number;
  top: Row[];
}

export default function TeacherMockExams() {
  const [data, setData] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/mock-exams")
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setData(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card text-center py-12 text-muted text-sm">در حال بارگذاری…</div>;

  return (
    <div className="space-y-6">
      <header>
        <div className="chip border-amber/30 text-amber bg-amber/5 mb-3">
          <Trophy className="w-3 h-3" /> آزمون آزمایشی
        </div>
        <h1 className="h2">نفرات برتر آزمون‌ها</h1>
        <p className="text-muted text-sm mt-1">
          عملکرد دانش‌آموزان در آزمون‌های مرتبط با دروس تو.
        </p>
      </header>

      {data.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">هنوز آزمونی مرتبط با دروس تو وجود ندارد.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(d => (
            <div key={d.exam.id} className="card">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <h3 className="font-bold">{d.exam.title}</h3>
                  <div className="text-xs text-muted mt-1 flex items-center gap-3 flex-wrap">
                    <span className="chip text-[10px]">پایهٔ {gradeLabel(d.exam.grade as any)} · {d.exam.major}</span>
                    <span>{formatIranDate(d.exam.scheduledAt)} · {formatIranTime(d.exam.scheduledAt)}</span>
                    <span>{d.exam.questionCount.toLocaleString("fa-IR")} سؤال</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-lime tabular-nums">{d.totalParticipants.toLocaleString("fa-IR")}</div>
                  <div className="text-[10px] text-muted flex items-center gap-1">
                    <Users className="w-3 h-3" /> شرکت‌کننده
                  </div>
                </div>
              </div>

              {d.top.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">هنوز کسی شرکت نکرده.</p>
              ) : (
                <div className="space-y-1.5">
                  {d.top.map((r, i) => (
                    <div key={r.userId} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}