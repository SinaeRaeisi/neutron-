"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, BookOpen, ClipboardList, Video, Trophy, LifeBuoy,
  ChevronLeft, Search, Shield, Crown,
} from "lucide-react";
import { gradeLabel } from "@/lib/data";

interface AdminUser {
  id: string; name: string; phone?: string;
  role: "student" | "teacher" | "admin";
  grade?: number; major?: string;
}
interface Stats {
  users: { total: number; students: number; teachers: number; admins: number };
  liveClasses: number;
  quizzes: number;
  mockExams: number;
  tickets: number;
  activeSubs: number;
}

const roleLabel = { student: "دانش‌آموز", teacher: "معلم", admin: "مدیر" } as const;
const roleColor = {
  student: "border-sky/40 text-sky bg-sky/10",
  teacher: "border-lime/40 text-lime bg-lime/10",
  admin: "border-amber/40 text-amber bg-amber/10",
} as const;

export default function AdminHome() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const [u, st] = await Promise.all([
        fetch("/api/admin/users").then(r => r.ok ? r.json() : { users: [] }),
        fetch("/api/admin/stats").then(r => r.ok ? r.json() : null),
      ]);
      setUsers(u.users ?? []);
      setStats(st);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function changeRole(userId: string, role: "student" | "teacher" | "admin") {
    if (!confirm(`نقش کاربر را به «${roleLabel[role]}» تغییر دهی؟`)) return;
    setBusy(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) await load();
      else alert("تغییر ناموفق.");
    } finally {
      setBusy(null);
    }
  }

  const filtered = users.filter(u =>
    u.name.includes(q) || (u.phone ?? "").includes(q)
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h2">پنل مدیریت</h1>
        <p className="text-muted text-sm mt-1">کاربران، محتوا، تیکت‌ها — همه‌چیز از یک‌جا.</p>
      </header>

      {/* آمار */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card !py-4">
            <Users className="w-4 h-4 mb-2 text-lime" />
            <div className="text-2xl font-black tabular-nums">{stats.users.total}</div>
            <div className="text-xs text-muted">کل کاربران</div>
            <div className="text-[10px] text-muted mt-1 flex gap-2">
              <span>{stats.users.students} دانش‌آموز</span>
              <span>·</span>
              <span>{stats.users.teachers} معلم</span>
            </div>
          </div>
          <div className="card !py-4">
            <Trophy className="w-4 h-4 mb-2 text-amber" />
            <div className="text-2xl font-black tabular-nums">{stats.mockExams}</div>
            <div className="text-xs text-muted">آزمون آزمایشی</div>
          </div>
          <div className="card !py-4">
            <Video className="w-4 h-4 mb-2 text-rose" />
            <div className="text-2xl font-black tabular-nums">{stats.liveClasses}</div>
            <div className="text-xs text-muted">کلاس زنده</div>
          </div>
          <div className="card !py-4">
            <Crown className="w-4 h-4 mb-2 text-violet" />
            <div className="text-2xl font-black tabular-nums">{stats.activeSubs}</div>
            <div className="text-xs text-muted">اشتراک فعال</div>
          </div>
        </div>
      )}

      {/* دسترسی سریع */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/admin/mock-exams", Icon: Trophy, title: "آزمون آزمایشی", desc: `${stats?.mockExams ?? 0} آزمون`, color: "amber" },
          { href: "/admin/tickets", Icon: LifeBuoy, title: "تیکت‌ها", desc: `${stats?.tickets ?? 0} تیکت`, color: "violet" },
          { href: "/teacher", Icon: BookOpen, title: "پنل معلم", desc: "نمای معلم", color: "lime" },
          { href: "/app", Icon: Users, title: "نمای دانش‌آموز", desc: "محصول", color: "sky" },
        ].map(l => {
          const colorMap: Record<string, string> = {
            amber: "bg-amber/10 border-amber/30 text-amber",
            violet: "bg-violet/10 border-violet/30 text-violet",
            lime: "bg-lime/10 border-lime/30 text-lime",
            sky: "bg-sky/10 border-sky/30 text-sky",
          };
          return (
            <Link key={l.href} href={l.href} className="card card-hover group">
              <div className={`w-9 h-9 rounded-xl2 border flex items-center justify-center mb-2 ${colorMap[l.color]}`}>
                <l.Icon className="w-4 h-4" />
              </div>
              <div className="font-semibold text-sm group-hover:text-lime">{l.title}</div>
              <div className="text-xs text-muted mt-0.5">{l.desc}</div>
            </Link>
          );
        })}
      </div>

      {/* کاربران */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold">کاربران ({filtered.length})</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
            <input className="input pr-9 text-sm py-2" placeholder="جست‌وجو بر اساس نام یا شماره…" value={q}
              onChange={e => setQ(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-8 text-muted text-sm">در حال بارگذاری…</div>
        ) : (
          <div className="card !p-0 divide-y divide-line">
            {filtered.map(u => (
              <div key={u.id} className="p-3 flex items-center gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-full bg-ink-3 flex items-center justify-center text-xs font-bold shrink-0">
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-[140px]">
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-xs text-muted mt-0.5" dir="ltr">
                    {u.phone ?? "—"}
                    {u.grade && <> · پایهٔ {gradeLabel(u.grade)}</>}
                    {u.major && <> · {u.major}</>}
                  </div>
                </div>
                <span className={`chip text-[10px] ${roleColor[u.role]}`}>{roleLabel[u.role]}</span>
                <select
                  className="input !py-1 !px-2 text-xs w-auto"
                  value={u.role}
                  onChange={e => changeRole(u.id, e.target.value as any)}
                  disabled={busy === u.id || u.role === "admin"}>
                  <option value="student">دانش‌آموز</option>
                  <option value="teacher">معلم</option>
                  <option value="admin" disabled>مدیر</option>
                </select>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted text-sm">کاربری پیدا نشد.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}