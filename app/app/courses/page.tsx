"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Clock, Lock, CheckCheck, BookOpen, Play, ListChecks } from "lucide-react";
import { getTeacher, gradeLabel, quizzes as demoQuizzes, courses as seedCourses } from "@/lib/data";
import type { Subscription, Course, Quiz } from "@/lib/types";

const cover = {
  lime: "from-lime/25 to-lime/5 border-lime/20",
  sky: "from-sky/25 to-sky/5 border-sky/20",
  violet: "from-violet/25 to-violet/5 border-violet/20",
  amber: "from-amber/25 to-amber/5 border-amber/20",
  rose: "from-rose/25 to-rose/5 border-rose/20",
} as const;

interface Me { grade?: number; major?: string; subscription: Subscription | null; }

export default function Courses() {
  const [me, setMe] = useState<Me | null>(null);
  const [courses, setCourses] = useState<Course[]>(seedCourses);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>(demoQuizzes);
  const [q, setQ] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/courses").then(r => r.ok ? r.json() : { courses: [] }).catch(() => ({ courses: [] })),
      fetch("/api/quizzes").then(r => r.ok ? r.json() : { quizzes: [] }).catch(() => ({ quizzes: [] })),
    ]).then(([meData, coursesData, quizzesData]) => {
      setMe(meData);
      if (coursesData.courses?.length) setCourses(coursesData.courses);
      if (quizzesData.quizzes?.length) setAllQuizzes(quizzesData.quizzes);
    }).finally(() => setLoaded(true));
  }, []);

  function isUnlocked(c: Course): boolean {
    if (!me?.subscription) return false;
    const s = me.subscription;
    if (s.grade !== c.grade) return false;
    if (c.major && c.major !== "عمومی" && s.major !== c.major) return false;
    return true;
  }

  const visible = useMemo(() => courses.filter(c => {
    if (me?.grade && c.grade !== me.grade) return false;
    if (me?.major && me.major !== "عمومی" && c.major && c.major !== me.major && c.major !== "عمومی") return false;
    if (q && !c.title.includes(q) && !c.summary.includes(q) && !c.subject.includes(q)) return false;
    return true;
  }), [courses, me, q]);

  const bySubject = useMemo(() => {
    const map = new Map<string, Course[]>();
    visible.forEach(c => {
      const arr = map.get(c.subject) ?? [];
      arr.push(c);
      map.set(c.subject, arr);
    });
    return map;
  }, [visible]);

  const visibleQuizzes = useMemo(
    () => allQuizzes.filter(qz => visible.some(c => c.id === qz.courseId)),
    [allQuizzes, visible]
  );

  const unlockedCount = visible.filter(isUnlocked).length;

  if (!loaded) return <div className="card text-center py-12 text-muted text-sm">…</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="h2">دوره‌ها</h1>
        <p className="text-muted text-sm mt-1">
          {me?.grade && me?.major ? `پایهٔ ${gradeLabel(me.grade)} — ${me.major}` : "در حال بارگذاری…"}
        </p>
      </header>

      {me && (me.subscription ? (
        <div className="card py-3 flex items-center justify-between flex-wrap gap-2 !rounded-xl2 bg-lime/5 border-lime/30">
          <div className="flex items-center gap-2 text-sm">
            <CheckCheck className="w-4 h-4 text-lime" />
            <span>اشتراک <b className="text-lime">فعال</b> — {unlockedCount} از {visible.length} دوره باز است.</span>
          </div>
          <Link href="/app/subscription" className="btn-ghost btn-sm">مدیریت</Link>
        </div>
      ) : (
        <div className="card py-3 flex items-center justify-between flex-wrap gap-2 !rounded-xl2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Lock className="w-4 h-4" /> هنوز اشتراک نداری.
          </div>
          <Link href="/app/subscription" className="btn-primary btn-sm">خرید اشتراک</Link>
        </div>
      ))}

      <div className="relative">
        <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
        <input className="input pr-10" placeholder="جست‌وجو در دوره‌های من…" value={q}
          onChange={e => setQ(e.target.value)} />
      </div>

      {visible.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-muted tracking-wider mb-3 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> دوره‌های درسی
          </h2>
          <div className="space-y-6">
            {[...bySubject.entries()].map(([subject, list]) => (
              <div key={subject}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="chip border-lime/40 text-lime bg-lime/5">{subject}</span>
                  <span className="text-xs text-muted">({list.length} دوره)</span>
                </div>

                {/* ═══ ۳ تا ۳ تا کنار هم ═══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {list.map(c => {
                    const t = getTeacher(c.teacherId);
                    const unlocked = isUnlocked(c);
                    return (
                      <Link key={c.id} href={`/app/course/${c.id}`}
                        className="card card-hover group relative">
                        <div className={`aspect-[16/9] rounded-xl2 mb-3 bg-gradient-to-br ${cover[c.cover]} border flex items-center justify-center relative overflow-hidden`}>
                          <div className="absolute inset-0 surface-grid opacity-20" />
                          <Play className="w-8 h-8 text-paper/40 group-hover:text-paper/80 group-hover:scale-110 transition" />
                          <span className="absolute top-2 right-2 chip text-[10px] bg-ink/70 backdrop-blur">
                            {gradeLabel(c.grade)}
                          </span>
                          {unlocked ? (
                            <span className="absolute bottom-2 left-2 chip text-[10px] bg-ink/80 border-lime/50 text-lime backdrop-blur">
                              <CheckCheck className="w-3 h-3" /> باز
                            </span>
                          ) : (
                            <span className="absolute bottom-2 left-2 chip text-[10px] bg-ink/80 backdrop-blur text-muted">
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted mb-1.5">
                          <span className="chip text-[10px]">{c.subject}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.lessons.length} جلسه</span>
                        </div>
                        <h3 className="font-bold group-hover:text-lime transition line-clamp-1">{c.title}</h3>
                        <p className="text-xs text-muted mt-1.5 line-clamp-2">{c.summary}</p>
                        <div className="flex items-center justify-between mt-3 text-xs text-muted">
                          <span>{t?.name}</span>
                          <span className="chip text-[10px]">{c.level}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {visibleQuizzes.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-muted tracking-wider mb-3 flex items-center gap-1.5">
            <ListChecks className="w-4 h-4" /> سنجش‌های کوتاه
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {visibleQuizzes.map(qz => {
              const course = courses.find(c => c.id === qz.courseId);
              return (
                <Link key={qz.id} href={`/app/quiz/${qz.id}`} className="card card-hover flex items-center gap-2.5 !p-3">
                  <div className="w-9 h-9 rounded-lg bg-sky/15 border border-sky/30 flex items-center justify-center shrink-0">
                    <ListChecks className="w-3.5 h-3.5 text-sky" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{qz.title}</div>
                    <div className="text-xs text-muted mt-0.5 truncate">
                      {course?.title ?? ""} · {qz.durationMin} دقیقه
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {visible.length === 0 && (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted">هنوز دوره‌ای برای پایهٔ تو تعریف نشده.</p>
        </div>
      )}
    </div>
  );
}