"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Play, FileText, ListChecks, Dumbbell, Lock, CheckCircle2,
  ChevronLeft, Clock, Users, ArrowRight, Circle, BookOpen,
} from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getTeacher, getCourseQuizzes } from "@/lib/data";
import type { Course, Lesson, Subscription } from "@/lib/types";

const DEMO_FREE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const PROGRESS_KEY = "neutron.lessonProgress.v1";

interface Me {
  grade?: number;
  major?: string;
  subscription: Subscription | null;
}

interface ProgressMap {
  [courseId: string]: {
    [lessonId: string]: { completed: boolean; at: string };
  };
}

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveProgress(p: ProgressMap) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch { /* */ }
}

const typeIcon = { video: Play, article: FileText, quiz: ListChecks, exercise: Dumbbell };
const typeLabel = { video: "ویدیو", article: "مقاله", quiz: "سنجش", exercise: "تمرین" };

export default function CoursePage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    setProgress(loadProgress());
    Promise.all([
      fetch("/api/courses").then(r => r.ok ? r.json() : { courses: [] }).catch(() => ({ courses: [] })),
      fetch("/api/me").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([coursesData, meData]) => {
      const found = (coursesData.courses as Course[]).find(c => c.id === params.id);
      if (!found) { setNotFound(true); setLoading(false); return; }
      setCourse(found);
      setMe(meData);
      const first = found.lessons.find(l => l.free) ?? found.lessons[0];
      setCurrentLesson(first ?? null);
    }).finally(() => setLoading(false));
  }, [params.id]);

  const canAccess = (l: Lesson): boolean => l.free === true || !!me?.subscription;

  const videoSrc = (l: Lesson): string | undefined => {
    if (l.videoUrl) return l.videoUrl;
    if (l.free && l.type === "video") return DEMO_FREE_VIDEO;
    return undefined;
  };

  function markComplete(lessonId: string) {
    if (!course) return;
    const next = { ...progress, [course.id]: { ...(progress[course.id] ?? {}) } };
    next[course.id][lessonId] = { completed: true, at: new Date().toISOString() };
    setProgress(next);
    saveProgress(next);
  }

  function goTo(l: Lesson) {
    if (!canAccess(l)) return;
    setCurrentLesson(l);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const completedCount = useMemo(() => {
    if (!course) return 0;
    const cp = progress[course.id] ?? {};
    return Object.keys(cp).filter(k => cp[k].completed).length;
  }, [course, progress]);

  const progressPct = course && course.lessons.length > 0
    ? Math.round((completedCount / course.lessons.length) * 100) : 0;

  if (loading) return <div className="card text-center py-12 text-muted text-sm">…</div>;
  if (notFound || !course) return (
    <div className="card text-center py-12">
      <p className="text-muted mb-4">دوره یافت نشد.</p>
      <Link href="/app/courses" className="btn-ghost">بازگشت به دوره‌ها</Link>
    </div>
  );

  const teacher = getTeacher(course.teacherId);
  const quizzes = getCourseQuizzes(course.id);
  const currentAccess = currentLesson ? canAccess(currentLesson) : false;
  const currentVideo = currentLesson ? videoSrc(currentLesson) : undefined;
  const currentCompleted = currentLesson && progress[course.id]?.[currentLesson.id]?.completed;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <Link href="/app/courses" className="text-sm text-muted hover:text-lime inline-flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> همهٔ دوره‌ها
      </Link>

      {/* Player */}
      {currentLesson && currentAccess && currentVideo && currentLesson.type === "video" ? (
        <VideoPlayer
          src={currentVideo}
          lessonId={currentLesson.id}
          courseId={course.id}
          onEnded={() => markComplete(currentLesson.id)}
        />
      ) : currentLesson && !currentAccess ? (
        <div className="aspect-video rounded-xl2 bg-gradient-to-br from-ink-2 to-ink-3 border border-line flex items-center justify-center">
          <div className="text-center px-6">
            <Lock className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">این جلسه قفل است</h3>
            <p className="text-muted text-sm mb-5">برای دسترسی به همهٔ جلسات، اشتراک فعال کن.</p>
            <Link href="/app/subscription" className="btn-primary">خرید اشتراک</Link>
          </div>
        </div>
      ) : (
        <div className="aspect-video rounded-xl2 bg-gradient-to-br from-ink-2 to-ink-3 border border-line flex items-center justify-center">
          <div className="text-center px-6">
            {currentLesson ? (
              <>
                <FileText className="w-12 h-12 text-lime mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-1">{currentLesson.title}</h3>
                <p className="text-muted text-sm">این جلسه از نوع «{typeLabel[currentLesson.type]}» است.</p>
              </>
            ) : <p className="text-muted">جلسه‌ای انتخاب نشده.</p>}
          </div>
        </div>
      )}

      {/* Under player */}
      {currentLesson && (
        <div className="card !p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm truncate">{currentLesson.title}</h2>
            <div className="text-xs text-muted mt-0.5 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{currentLesson.durationMin} دقیقه</span>
              <span>·</span>
              <span>{typeLabel[currentLesson.type]}</span>
              {currentLesson.free && <span className="chip text-[10px] border-lime/40 text-lime">رایگان</span>}
            </div>
          </div>
          {currentAccess && (
            <button
              onClick={() => markComplete(currentLesson.id)}
              disabled={!!currentCompleted}
              className={currentCompleted ? "btn-ghost btn-sm !text-ok" : "btn-primary btn-sm"}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {currentCompleted ? "تکمیل شده" : "علامت‌گذاری تکمیل"}
            </button>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="chip">{course.subject}</span>
              <span className="chip">{course.level}</span>
              <span className="chip">پایهٔ {course.grade}</span>
              {course.major && course.major !== "عمومی" && <span className="chip">{course.major}</span>}
            </div>
            <h1 className="h2 mb-2">{course.title}</h1>
            <p className="text-sm text-muted">{course.summary}</p>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted flex-wrap">
              <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{course.lessons.length} جلسه</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{teacher?.name}</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">پیشرفت تو</h3>
              <span className="text-sm font-bold text-lime tabular-nums">{progressPct}٪</span>
            </div>
            <div className="h-2 bg-ink-3 rounded-full overflow-hidden">
              <div className="h-full bg-lime transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs text-muted mt-2">
              {completedCount.toLocaleString("fa-IR")} از {course.lessons.length.toLocaleString("fa-IR")} جلسه تکمیل شده
            </p>
          </div>

          {quizzes.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-lime" /> سنجش‌های این دوره
              </h3>
              <div className="space-y-2">
                {quizzes.map(q => (
                  <Link key={q.id} href={`/app/quiz/${q.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-ink-3 hover:bg-ink-3/70 transition">
                    <ListChecks className="w-4 h-4 text-lime shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{q.title}</div>
                      <div className="text-xs text-muted">{q.durationMin} دقیقه · {q.questions.length} سؤال</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 lg:sticky lg:top-20 self-start">
          <div className="card !p-3">
            <h3 className="font-bold text-sm mb-2 px-1">فهرست جلسات</h3>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {course.lessons.map((l, i) => {
                const Icon = typeIcon[l.type];
                const isCurrent = currentLesson?.id === l.id;
                const isDone = progress[course.id]?.[l.id]?.completed;
                const ok = canAccess(l);
                return (
                  <button
                    key={l.id}
                    onClick={() => goTo(l)}
                    disabled={!ok}
                    className={`w-full text-right flex items-start gap-2.5 p-2 rounded-lg transition ${
                      isCurrent ? "bg-lime/10 border border-lime/30" :
                      ok ? "hover:bg-ink-3" : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isDone ? "bg-ok/15" :
                      isCurrent ? "bg-lime text-ink" :
                      ok ? "bg-ink-3" : "bg-ink-3/50"
                    }`}>
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-ok" /> :
                       !ok ? <Lock className="w-3 h-3 text-muted" /> :
                       isCurrent ? <Icon className="w-3.5 h-3.5" /> :
                       <Circle className="w-3 h-3 text-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium line-clamp-2 ${isCurrent ? "text-lime" : ""}`}>
                        {i + 1}. {l.title}
                      </div>
                      <div className="text-[10px] text-muted mt-0.5">
                        {l.durationMin} دقیقه{l.free && <span className="text-lime"> · رایگان</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {teacher && (
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-lime/20 text-lime flex items-center justify-center font-bold">
                  {teacher.name[0]}
                </div>
                <div>
                  <div className="font-bold text-sm">{teacher.name}</div>
                  <div className="text-xs text-muted">مدرس دوره</div>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed line-clamp-3">{teacher.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}