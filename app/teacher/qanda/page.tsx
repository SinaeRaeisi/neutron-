"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LifeBuoy, MessageSquare, BookOpen, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { courses as seedCourses, getCourse } from "@/lib/data";
import type { QandAQuestion, Course } from "@/lib/types";

interface Me { id: string; name: string; role: string; }

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
  return `${d.toLocaleString("fa-IR")} روز پیش`;
}

export default function TeacherQandA() {
  const [me, setMe] = useState<Me | null>(null);
  const [questions, setQuestions] = useState<QandAQuestion[]>([]);
  const [courses, setCourses] = useState<Course[]>(seedCourses);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/qanda").then(r => r.ok ? r.json() : { questions: [] }).catch(() => ({ questions: [] })),
      fetch("/api/courses").then(r => r.ok ? r.json() : { courses: [] }).catch(() => ({ courses: [] })),
    ]).then(([meData, qRes, cRes]) => {
      setMe(meData);
      setQuestions(qRes.questions ?? []);
      if (cRes.courses?.length) setCourses(cRes.courses);
    }).finally(() => setLoading(false));
  }, []);

  const myCourseIds = useMemo(() => {
    if (!me?.id) return new Set<string>();
    return new Set(
      courses
        .filter(c => c.teacherId === me.id || (c.availableTeachers ?? []).includes(me.id))
        .map(c => c.id)
    );
  }, [courses, me]);

  const filtered = useMemo(
    () => questions.filter(q => !q.courseId || myCourseIds.has(q.courseId)),
    [questions, myCourseIds]
  );

  const openCount = filtered.filter(q => q.status === "open").length;

  return (
    <div className="space-y-5">
      <header>
        <div className="chip border-violet/30 text-violet bg-violet/5 mb-3">
          <LifeBuoy className="w-3 h-3" /> رفع اشکال
        </div>
        <h1 className="h2">سؤال‌های دانش‌آموزان</h1>
        <p className="text-muted text-sm mt-1">
          سؤال‌های دوره‌های خودت — پاسخ بده، به دانش‌آموزان کمک کن.
          {openCount > 0 && <span className="text-amber font-semibold"> · {openCount.toLocaleString("fa-IR")} بدون پاسخ</span>}
        </p>
      </header>

      {loading ? (
        <div className="card text-center py-8 text-muted text-sm">…</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <LifeBuoy className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">هنوز سؤالی از دوره‌های تو ثبت نشده.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => {
            const st = statusMeta[q.status];
            const course = q.courseId ? getCourse(q.courseId) : null;
            const needsAnswer = q.status === "open";
            return (
              <Link key={q.id} href={`/app/qanda/${q.id}`}
                className={`card card-hover block group ${needsAnswer ? "!border-amber/40" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    needsAnswer ? "bg-amber/20 text-amber" : "bg-ink-3"
                  }`}>
                    {needsAnswer ? <AlertCircle className="w-4 h-4" /> : q.userName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`chip text-[10px] ${st.color}`}>{st.text}</span>
                      {course && (
                        <span className="chip text-[10px] flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />{course.title}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm group-hover:text-lime transition line-clamp-1">
                      {q.title}
                    </h3>
                    <p className="text-xs text-muted mt-1 line-clamp-2">{q.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted">
                      <span>{q.userName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(q.createdAt)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted shrink-0 group-hover:text-lime transition" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}