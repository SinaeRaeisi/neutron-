"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Video, Clock, Calendar, Radio, Lock, ArrowLeft, Users, RefreshCw } from "lucide-react";
import { liveClasses as baseLive, getTeacher, getCourse } from "@/lib/data";
import { formatIranDate, formatIranTime } from "@/lib/iran-time";
import type { LiveClass, Subscription } from "@/lib/types";

interface Me { subscription: Subscription | null; grade?: number; major?: string; }

export default function LivePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [custom, setCustom] = useState<LiveClass[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  async function loadClasses() {
    try {
      const d = await fetch("/api/live-classes").then(r => r.ok ? r.json() : { classes: [] });
      setCustom(d.classes ?? []);
    } catch { /* noop */ }
  }

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(m => setMe(m)).catch(() => {});
    loadClasses().finally(() => setLoaded(true));
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  async function manualRefresh() {
    setRefreshing(true);
    setNow(Date.now());
    await loadClasses();
    setTimeout(() => setRefreshing(false), 500);
  }

  if (!loaded) return <div className="card text-center py-12 text-muted text-sm">در حال بارگذاری…</div>;

  const hasSub = !!me?.subscription;
  const all = [...baseLive, ...custom];

  const visible = all.filter(l => {
    if (!me?.grade) return false;
    const course = getCourse(l.courseId);
    if (!course) return false;
    if (course.grade !== me.grade) return false;
    if (me.major && me.major !== "عمومی" && course.major && course.major !== me.major && course.major !== "عمومی") return false;
    return true;
  });

  const byCourse = new Map<string, LiveClass[]>();
  visible.forEach(l => {
    const arr = byCourse.get(l.courseId) ?? [];
    arr.push(l);
    byCourse.set(l.courseId, arr);
  });
  const sessionNumber = new Map<string, number>();
  byCourse.forEach(arr => {
    [...arr].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .forEach((l, i) => sessionNumber.set(l.id, i + 1));
  });

  const sorted = [...visible].sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="chip border-rose/30 text-rose bg-rose/5 mb-3">
            <Radio className="w-3 h-3" /> کلاس زنده
          </div>
          <h1 className="h2">کلاس‌های زنده</h1>
          <p className="text-muted text-sm mt-1">
            در لحظهٔ شروع تا پایان کلاس می‌تونی وارد شی.
          </p>
        </div>
        <button onClick={manualRefresh} disabled={refreshing} className="btn-ghost btn-sm">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          به‌روزرسانی
        </button>
      </header>

      {!hasSub && (
        <div className="card flex items-center justify-between flex-wrap gap-3 !rounded-xl2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Lock className="w-4 h-4" /> اشتراک فعال نداری.
          </div>
          <Link href="/app/subscription" className="btn-primary btn-sm">خرید اشتراک</Link>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted">هنوز کلاس زنده‌ای برای پایهٔ تو تعریف نشده.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sorted.map(l => {
            const teacher = getTeacher(l.teacherId);
            const course = getCourse(l.courseId);
            const dt = new Date(l.scheduledAt);
            const startMs = dt.getTime();
            const endMs = startMs + l.durationMin * 60 * 1000;
            const canEnter = now >= startMs && now <= endMs;   // ← لحظه‌ای
            const isPast = now > endMs;
            const minutesToStart = Math.max(0, Math.ceil((startMs - now) / 60000));
            const minutesToEnd = Math.max(0, Math.ceil((endMs - now) / 60000));
            const sessionNo = sessionNumber.get(l.id) ?? 1;

            let statusChip: { text: string; cls: string };
            if (isPast) {
              statusChip = { text: "پایان‌یافته", cls: "border-line text-muted" };
            } else if (canEnter) {
              statusChip = {
                text: minutesToEnd <= 15 ? `الان · ${minutesToEnd} دقیقه مونده` : "الان می‌تونی وارد شی",
                cls: "border-danger/40 text-danger bg-danger/10 animate-pulse-soft",
              };
            } else {
              statusChip = {
                text: `شروع در ${minutesToStart} دقیقه`,
                cls: "border-sky/40 text-sky bg-sky/10",
              };
            }

            return (
              <div key={l.id} className={`card ${hasSub && canEnter ? "card-hover border-rose/30" : ""}`}>
                <div className="flex items-start gap-4 flex-wrap">
                  <div className={`w-14 h-14 rounded-xl2 flex items-center justify-center shrink-0 ${
                    canEnter ? "bg-danger/15 border-2 border-danger/40" : "bg-lime/15 border border-lime/30"
                  }`}>
                    <Video className={`w-6 h-6 ${canEnter ? "text-danger" : "text-lime"}`} />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`chip text-[10px] ${statusChip.cls}`}>{statusChip.text}</span>
                      {course && <span className="chip text-[10px]">{course.subject}</span>}
                      {l.attachments && l.attachments.length > 0 && (
                        <span className="chip text-[10px] border-sky/40 text-sky bg-sky/10">
                          📎 جزوه
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold">
                      جلسهٔ {sessionNo.toLocaleString("fa-IR")} · {l.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatIranDate(l.scheduledAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatIranTime(l.scheduledAt)} · {l.durationMin} دقیقه</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{l.enrolled}/{l.capacity}</span>
                    </div>
                    <div className="text-xs text-muted mt-1.5">با {teacher?.name ?? "استاد"}</div>
                  </div>
                  <div className="shrink-0 self-center">
                    {!hasSub ? (
                      <Lock className="w-4 h-4 text-muted" />
                    ) : canEnter ? (
                      <Link href={`/app/live/${l.id}`} className="btn-primary btn-sm">
                        ورود <ArrowLeft className="w-3.5 h-3.5" />
                      </Link>
                    ) : isPast ? (
                      <span className="text-xs text-muted">پایان‌یافته</span>
                    ) : (
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />{minutesToStart} دقیقه
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}