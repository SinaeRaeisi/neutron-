"use client";
import { useEffect, useState } from "react";
import {
  User as UserIcon, Check, Save, TrendingUp, BookOpen, Calendar, Crown,
} from "lucide-react";
import { GRADES, gradeLabel, majorsForGrade } from "@/lib/data";
import { planName, type PlanId } from "@/lib/plans";
import type { Subscription } from "@/lib/types";

interface Me {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  grade?: number;
  major?: string;
  subscription: Subscription | null;
}

interface AttemptsSummary { total: number; average: number; }

export default function Profile() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number>(10);
  const [major, setMajor] = useState<string>("ریاضی");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<AttemptsSummary>({ total: 0, average: 0 });

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(m => {
      if (m) {
        setMe(m);
        setName(m.name ?? "");
        setPhone(m.phone ?? "");
        const g = m.grade ? Number(m.grade) : 10;
        setGrade(g);
        const allowed = majorsForGrade(g);
        setMajor(m.major && allowed.includes(m.major) ? m.major : allowed[0]);
      }
    }).catch(() => {});

    // آمار واقعی از تلاش‌های کاربر
    try {
      const raw = localStorage.getItem("neutron.state.v1");
      if (raw) {
        const s = JSON.parse(raw);
        const attempts = Array.isArray(s.attempts) ? s.attempts : [];
        if (attempts.length > 0) {
          const avg = Math.round(
            attempts.reduce((sum: number, a: any) => sum + (a.score ?? 0), 0) / attempts.length
          );
          setStats({ total: attempts.length, average: avg });
        }
      }
    } catch { /* noop */ }
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim() || name.trim().length < 2) {
      setErr("نام حداقل ۲ حرف باشد.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grade,
          major,
          phone: phone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "ذخیره ناموفق."); return; }
      setMe(prev => prev ? { ...prev, ...data.user } : null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setErr("خطای شبکه.");
    } finally {
      setBusy(false);
    }
  }

  if (!me) return <div className="card text-center py-12 text-muted text-sm">در حال بارگذاری…</div>;

  const sub = me.subscription;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header>
        <h1 className="h2">پروفایل</h1>
        <p className="text-muted text-sm mt-1">اطلاعاتت را به‌روز نگه دار.</p>
      </header>

      {/* کارت هویت */}
      <div className="card text-center py-6 bg-gradient-to-br from-ink-2 to-ink-3">
        <div className="w-20 h-20 rounded-full bg-lime/20 text-lime flex items-center justify-center text-3xl font-black mx-auto mb-3 border-2 border-lime/30">
          {me.name[0]}
        </div>
        <div className="font-bold text-lg">{me.name}</div>
        <div className="text-xs text-muted mt-1" dir="ltr">
          {me.email ?? me.phone ?? "—"}
        </div>
        {me.grade && (
          <div className="text-xs text-muted mt-1">
            پایهٔ {gradeLabel(me.grade)} {me.major && `· ${me.major}`}
          </div>
        )}
        {sub && (
          <div className="mt-3 inline-flex items-center gap-1.5 chip border-lime/40 text-lime bg-lime/10">
            <Crown className="w-3 h-3" /> اشتراک {planName[sub.plan as PlanId]}
          </div>
        )}
      </div>

      {/* آمار واقعی */}
      {(stats.total > 0 || sub) && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="card !py-4 text-center">
            <BookOpen className="w-4 h-4 text-lime mx-auto mb-2" />
            <div className="text-2xl font-black tabular-nums">{stats.total.toLocaleString("fa-IR")}</div>
            <div className="text-xs text-muted">سنجش</div>
          </div>
          {stats.total > 0 && (
            <div className="card !py-4 text-center">
              <TrendingUp className="w-4 h-4 text-ok mx-auto mb-2" />
              <div className="text-2xl font-black tabular-nums">{stats.average}٪</div>
              <div className="text-xs text-muted">میانگین نمره</div>
            </div>
          )}
          {sub && (
            <div className="card !py-4 text-center">
              <Calendar className="w-4 h-4 text-lime mx-auto mb-2" />
              <div className="text-xs font-bold">
                {new Date(sub.expiresAt).toLocaleDateString("fa-IR", {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </div>
              <div className="text-xs text-muted">اعتبار اشتراک</div>
            </div>
          )}
        </div>
      )}

      {/* فرم */}
      <form onSubmit={save} className="card space-y-4">
        <div>
          <label className="label">نام و نام خانوادگی</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">شمارهٔ موبایل (اختیاری)</label>
          <input dir="ltr" type="tel" inputMode="numeric" className="input text-left"
            placeholder="09xxxxxxxxx"
            value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d]/g, ""))} />
        </div>
        <div>
          <label className="label">پایهٔ تحصیلی</label>
          <select
            className="input"
            value={grade}
            onChange={e => {
              const g = Number(e.target.value);
              setGrade(g);
              const allowed = majorsForGrade(g);
              if (!allowed.includes(major)) setMajor(allowed[0]);
            }}
          >
            {GRADES.map(g => <option key={g} value={g}>{gradeLabel(g)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">رشته</label>
          <select className="input" value={major} onChange={e => setMajor(e.target.value)}>
            {majorsForGrade(grade).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {err && <p className="text-danger text-sm">{err}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {saved ? <><Check className="w-4 h-4" /> ذخیره شد</> :
           busy ? "…" : <><Save className="w-4 h-4" /> ذخیره تغییرات</>}
        </button>
      </form>

      <div className="card text-xs text-muted">
        <UserIcon className="w-3.5 h-3.5 inline" /> بعد از تغییر پایه/رشته، دوره‌های مناسب به‌طور خودکار به‌روز می‌شوند.
      </div>
    </div>
  );
}