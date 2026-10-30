"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar as CalIcon, Video, Trophy, ArrowLeft } from "lucide-react";
import { formatIranDate, formatIranTime } from "@/lib/iran-time";
import { gradeLabel } from "@/lib/data";
import { liveClasses as baseLive } from "@/lib/data";
import type { LiveClass, MockExam, Subscription } from "@/lib/types";

interface Me { grade?: number; major?: string; subscription: Subscription | null; }
interface Event {
  id: string;
  kind: "live" | "mock";
  title: string;
  scheduledAt: string;
  href: string;
  subtitle: string;
}

export default function CalendarPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [customLive, setCustomLive] = useState<LiveClass[]>([]);
  const [mocks, setMocks] = useState<MockExam[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/live-classes").then(r => r.ok ? r.json() : { classes: [] }).catch(() => ({ classes: [] })),
      fetch("/api/mock-exams-admin").then(r => r.ok ? r.json() : { exams: [] }).catch(() => ({ exams: [] })),
    ]).then(([m, live, mock]) => {
      setMe(m);
      setCustomLive(live.classes ?? []);
      setMocks(mock.exams ?? []);
    }).finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <div className="card text-center py-12 text-muted text-sm">در حال بارگذاری…</div>;
  if (!me?.grade) return (
    <div className="card text-center py-12">
      <p className="text-muted">اول پایه‌ات را در پروفایل تنظیم کن.</p>
    </div>
  );

  // همه رویدادها (فقط مرتبط با پایه کاربر)
  const events: Event[] = [];

  // کلاس‌های زنده
  [...baseLive, ...customLive].forEach(l => {
    const courseGrade = l.courseId.startsWith("co") ? null : null; // placeholder
    // فقط کلاس‌های دوره‌های مرتبط
    events.push({
      id: l.id,
      kind: "live",
      title: l.title,
      scheduledAt: l.scheduledAt,
      href: `/app/live/${l.id}`,
      subtitle: "کلاس زنده",
    });
  });

  // آزمون‌ها
  mocks.forEach(m => {
    if (m.grade !== me.grade) return;
    if (me.major && me.major !== "عمومی" && m.major !== me.major && m.major !== "عمومی") return;
    events.push({
      id: m.id,
      kind: "mock",
      title: m.title,
      scheduledAt: m.scheduledAt,
      href: `/app/mock-exams/${m.id}`,
      subtitle: `آزمون · پایهٔ ${gradeLabel(m.grade as any)} ${m.major}`,
    });
  });

  // گروه‌بندی بر اساس روز ایران
  const byDay = new Map<string, Event[]>();
  events.forEach(e => {
    const day = formatIranDate(e.scheduledAt, { weekday: undefined });
    const arr = byDay.get(day) ?? [];
    arr.push(e);
    byDay.set(day, arr);
  });

  const sortedDays = [...byDay.entries()]
    .map(([day, evs]) => ({
      day,
      dayMs: Math.min(...evs.map(e => new Date(e.scheduledAt).getTime())),
      events: evs.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    }))
    .sort((a, b) => a.dayMs - b.dayMs);

  const nowMs = Date.now();
  const upcoming = sortedDays.filter(d => d.dayMs >= nowMs - 60 * 60 * 1000);
  const past = sortedDays.filter(d => d.dayMs < nowMs - 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      <header>
        <div className="chip border-sky/30 text-sky bg-sky/5 mb-3">
          <CalIcon className="w-3 h-3" /> تقویم
        </div>
        <h1 className="h2">برنامهٔ من</h1>
        <p className="text-muted text-sm mt-1">
          کلاس‌ها و آزمون‌های پیش‌رو — بر اساس پایهٔ {gradeLabel(me.grade)}.
        </p>
      </header>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="card text-center py-12">
          <CalIcon className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">برنامه‌ای برای تو ثبت نشده.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-muted tracking-wider mb-3">پیش‌رو</h2>
              <div className="space-y-3">
                {upcoming.map(d => (
                  <div key={d.day} className="space-y-2">
                    <div className="text-sm font-bold text-paper px-1">{d.day}</div>
                    {d.events.map(e => {
                      const isLive = e.kind === "live";
                      return (
                        <Link key={e.id} href={e.href}
                          className="card card-hover flex items-center gap-3 group">
                          <div className={`w-10 h-10 rounded-xl2 flex items-center justify-center shrink-0 ${
                            isLive ? "bg-rose/15 border border-rose/30" : "bg-amber/15 border border-amber/30"
                          }`}>
                            {isLive ? <Video className="w-4 h-4 text-rose" /> : <Trophy className="w-4 h-4 text-amber" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate group-hover:text-lime transition">{e.title}</div>
                            <div className="text-xs text-muted mt-0.5 flex items-center gap-2">
                              <span>{formatIranTime(e.scheduledAt)}</span>
                              <span>·</span>
                              <span>{e.subtitle}</span>
                            </div>
                          </div>
                          <ArrowLeft className="w-4 h-4 text-muted shrink-0 group-hover:text-lime transition" />
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-muted tracking-wider mb-3">گذشته</h2>
              <div className="space-y-2 opacity-60">
                {past.slice(0, 5).map(d => (
                  <div key={d.day}>
                    <div className="text-sm font-medium text-muted px-1 mb-1">{d.day}</div>
                    {d.events.map(e => (
                      <div key={e.id} className="card !py-2.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-ink-3 flex items-center justify-center shrink-0">
                          {e.kind === "live" ? <Video className="w-3.5 h-3.5 text-muted" /> : <Trophy className="w-3.5 h-3.5 text-muted" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{e.title}</div>
                          <div className="text-xs text-muted">{formatIranTime(e.scheduledAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}