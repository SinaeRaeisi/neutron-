"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame, TrendingUp, BookOpen, Video, Trophy, LifeBuoy,
  Play, ChevronLeft, Clock, Zap, ArrowLeft, Target,
} from "lucide-react";
import { courses as seedCourses, getTeacher, gradeLabel, quizzes as demoQuizzes } from "@/lib/data";
import { useNeutronStore, getAttempts } from "@/lib/store";
import type { Course, Subscription, Quiz } from "@/lib/types";

interface Me {
  name: string; role: string; grade?: number; major?: string;
  subscription: Subscription | null;
}

function computeStreak(attempts: { takenAt: string }[]): number {
  if (!attempts.length) return 0;
  const days = new Set(attempts.map(a => new Date(a.takenAt).toDateString()));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
    if (streak > 365) break;
  }
  return streak;
}

function weekBuckets(attempts: { takenAt: string }[]) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toDateString();
    const count = attempts.filter(a => new Date(a.takenAt).toDateString() === key).length;
    return {
      day: ["ش", "ی", "د", "س", "چ", "پ", "ج"][d.getDay()],
      count,
      isToday: d.toDateString() === now.toDateString(),
    };
  });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "صبح بخیر";
  if (h < 17) return "وقت بخیر";
  return "شب بخیر";
}

export default function Today() {
  const [me, setMe] = useState<Me | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>(seedCourses);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>(demoQuizzes);
  const [loaded, setLoaded] = useState(false);
  const attempts = useNeutronStore(getAttempts, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/courses").then(r => r.ok ? r.json() : { courses: [] }).catch(() => ({ courses: [] })),
      fetch("/api/quizzes").then(r => r.ok ? r.json() : { quizzes: [] }).catch(() => ({ quizzes: [] })),
    ]).then(([meData, coursesData, quizzesData]) => {
      setMe(meData);
      if (coursesData.courses?.length) setAllCourses(coursesData.courses);
      if (quizzesData.quizzes?.length) setAllQuizzes(quizzesData.quizzes);
    }).finally(() => setLoaded(true));
  }, []);

  const streak = useMemo(() => computeStreak(attempts), [attempts]);
  const week = useMemo(() => weekBuckets(attempts), [attempts]);
  const maxWeek = Math.max(1, ...week.map(w => w.count));

  const myCourses = useMemo(() => {
    if (!me?.grade) return [];
    return allCourses.filter(c => {
      if (c.grade !== me.grade) return false;
      if (me.major && me.major !== "عمومی" && c.major && c.major !== me.major && c.major !== "عمومی") return false;
      return true;
    });
  }, [allCourses, me]);

  const hasSub = !!me?.subscription;
  const activeCourse = myCourses[0];
  const activeTeacher = activeCourse ? getTeacher(activeCourse.teacherId) : null;
  const activeQuizzes = activeCourse ? allQuizzes.filter(q => q.courseId === activeCourse.id) : [];
  const recentAttempts = attempts.slice(0, 3);

  if (!loaded) return <div className="card text-center py-12 text-muted text-sm">…</div>;

  if (!me) return (
    <div className="card text-center py-12">
      <p className="text-muted mb-4">جلسه پیدا نشد.</p>
      <Link href="/login" className="btn-primary">ورود</Link>
    </div>
  );

  if (me.role !== "student") return (
    <div className="card text-center py-12">
      <p className="text-muted mb-4">این صفحه مخصوص دانش‌آموزان است.</p>
      <Link href={me.role === "admin" ? "/admin" : "/teacher"} className="btn-primary">
        پنل {me.role === "admin" ? "مدیر" : "معلم"}
      </Link>
    </div>
  );

  if (!me.grade) return (
    <div className="card text-center py-12 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-lime/15 flex items-center justify-center mx-auto mb-4">
        <Target className="w-8 h-8 text-lime" />
      </div>
      <h2 className="h3 mb-2">پایه و رشته‌ات را وارد کن</h2>
      <p className="text-muted text-sm mb-5">برای دیدن دوره‌های مناسب، ابتدا پروفایلت را کامل کن.</p>
      <Link href="/app/profile" className="btn-primary">تکمیل پروفایل</Link>
    </div>
  );

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card !p-6 bg-gradient-to-br from-ink-2 to-ink-3 border-line/80"
      >
        <div className="absolute inset-0 bg-mesh opacity-40" />
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-lime/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-muted">{greeting()}، {me.name.split(" ")[0]}</p>
            <h1 className="text-2xl md:text-3xl font-black mt-1">
              پایهٔ {gradeLabel(me.grade)} {me.major && <span className="text-lime">· {me.major}</span>}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center px-4 py-2 rounded-xl2 bg-ink/60 backdrop-blur border border-line/60">
              <div className="flex items-center justify-center gap-1 text-amber">
                <Flame className="w-4 h-4" />
                <span className="text-xl font-black tabular-nums">{streak.toLocaleString("fa-IR")}</span>
              </div>
              <div className="text-[10px] text-muted mt-0.5">روز پیاپی</div>
            </div>
            <div className="text-center px-4 py-2 rounded-xl2 bg-ink/60 backdrop-blur border border-line/60">
              <div className="flex items-center justify-center gap-1 text-lime">
                <BookOpen className="w-4 h-4" />
                <span className="text-xl font-black tabular-nums">{attempts.length.toLocaleString("fa-IR")}</span>
              </div>
              <div className="text-[10px] text-muted mt-0.5">سنجش</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Subscription */}
      {!hasSub && (
        <Link href="/app/subscription"
          className="flex items-center justify-between gap-3 p-4 rounded-xl2 bg-gradient-to-l from-lime/20 to-lime/5 border border-lime/40 hover:border-lime/60 transition group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl2 bg-lime text-ink flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">اشتراک فعال کن</div>
              <div className="text-xs text-muted mt-0.5">همهٔ محتوای پایه‌ات باز می‌شود</div>
            </div>
          </div>
          <ArrowLeft className="w-5 h-5 text-lime shrink-0 group-hover:-translate-x-1 transition" />
        </Link>
      )}

      {/* Week chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-lime" />
            <h3 className="font-bold text-sm">فعالیت هفت روز اخیر</h3>
          </div>
          <span className="text-xs text-muted">
            {week.reduce((s, w) => s + w.count, 0).toLocaleString("fa-IR")} سنجش
          </span>
        </div>
        <div className="flex items-end justify-between gap-2 h-24">
          {week.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex-1 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(w.count / maxWeek) * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                  className={`w-full rounded-t-md min-h-[4px] ${
                    w.count > 0 ? "bg-lime" : "bg-ink-4"
                  } ${w.isToday ? "ring-2 ring-lime/50" : ""}`}
                />
              </div>
              <div className={`text-[10px] ${w.isToday ? "text-lime font-bold" : "text-muted"}`}>
                {w.day}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active course */}
      {activeCourse && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-muted tracking-wider">ادامهٔ یادگیری</h2>
            <Link href="/app/courses" className="text-xs text-lime hover:opacity-80">همهٔ دوره‌ها</Link>
          </div>
          <Link href={`/app/course/${activeCourse.id}`}
            className="card card-hover group block">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl2 bg-gradient-to-br from-lime/25 to-lime/5 border border-lime/30 flex items-center justify-center shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 surface-grid opacity-30" />
                <Play className="w-6 h-6 text-lime relative" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold group-hover:text-lime transition truncate">{activeCourse.title}</div>
                <div className="text-xs text-muted mt-1 flex items-center gap-2 flex-wrap">
                  <span>{activeTeacher?.name}</span>
                  <span>·</span>
                  <span>{activeCourse.lessons.length} جلسه</span>
                  <span>·</span>
                  <span>{activeCourse.subject}</span>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted group-hover:text-lime group-hover:-translate-x-1 transition shrink-0" />
            </div>
          </Link>
        </div>
      )}

      {/* Suggested quiz */}
      {activeQuizzes.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-muted tracking-wider mb-2">قدم بعدی</h2>
          <Link href={`/app/quiz/${activeQuizzes[0].id}`}
            className="card card-hover group block bg-gradient-to-l from-sky/10 to-transparent border-sky/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl2 bg-sky/20 border border-sky/40 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-sky" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-sky font-semibold mb-0.5">سنجش کوتاه</div>
                <div className="font-bold text-sm truncate group-hover:text-lime transition">{activeQuizzes[0].title}</div>
                <div className="text-xs text-muted mt-0.5 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {activeQuizzes[0].durationMin} دقیقه · {activeQuizzes[0].questions.length} سؤال
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-sky shrink-0 group-hover:-translate-x-1 transition" />
            </div>
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-xs font-bold text-muted tracking-wider mb-2">دسترسی سریع</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { href: "/app/courses", Icon: BookOpen, label: "دوره‌ها", color: "lime" },
            { href: "/app/live", Icon: Video, label: "کلاس زنده", color: "rose" },
            { href: "/app/mock-exams", Icon: Trophy, label: "آزمون آزمایشی", color: "amber" },
            { href: "/app/support", Icon: LifeBuoy, label: "پشتیبانی", color: "violet" },
          ].map(l => {
            const colorMap: Record<string, string> = {
              lime: "bg-lime/10 border-lime/30 text-lime",
              rose: "bg-rose/10 border-rose/30 text-rose",
              amber: "bg-amber/10 border-amber/30 text-amber",
              violet: "bg-violet/10 border-violet/30 text-violet",
            };
            return (
              <Link key={l.href} href={l.href} className="card card-hover !p-3 text-center group">
                <div className={`w-10 h-10 rounded-xl2 ${colorMap[l.color]} border flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition`}>
                  <l.Icon className="w-5 h-5" />
                </div>
                <div className="text-xs font-medium">{l.label}</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent attempts */}
      {recentAttempts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-muted tracking-wider">آخرین سنجش‌ها</h2>
            <Link href="/app/progress" className="text-xs text-lime hover:opacity-80">همه</Link>
          </div>
          <div className="space-y-1.5">
            {recentAttempts.map(a => {
              const q = allQuizzes.find(x => x.id === a.quizId);
              return (
                <div key={a.id} className="card !py-2.5 !px-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black tabular-nums shrink-0 ${
                    a.score >= 70 ? "bg-ok/15 text-ok" :
                    a.score >= 40 ? "bg-lime/15 text-lime" :
                    "bg-danger/15 text-danger"
                  }`}>{a.score}٪</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{q?.title ?? "آزمون"}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {new Date(a.takenAt).toLocaleDateString("fa-IR")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {myCourses.length === 0 && (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">هنوز دوره‌ای برای پایهٔ تو تعریف نشده.</p>
        </div>
      )}
    </div>
  );
}