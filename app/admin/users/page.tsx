"use client";
import { useEffect, useState } from "react";
import { UserPlus, Trash2, Shield, GraduationCap, BookOpen } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "teacher" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers((await res.json()).users);
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", email: "", password: "", role: "teacher" });
      await load();
    } else {
      alert((await res.json()).error);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h2">مدیریت کاربران</h1>
        <p className="text-muted text-sm mt-1">ساخت معلم جدید یا مشاهده کاربران.</p>
      </header>

      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-bold text-sm">افزودن کاربر جدید</h2>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder="نام" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input className="input" placeholder="ایمیل" dir="ltr" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder="رمز عبور" dir="ltr" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="teacher">معلم</option>
            <option value="student">دانش‌آموز</option>
            <option value="admin">مدیر</option>
          </select>
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          <UserPlus className="w-4 h-4" /> ساخت کاربر
        </button>
      </form>

      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="card flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">{u.name}</div>
              <div className="text-xs text-muted" dir="ltr">{u.email}</div>
            </div>
            <span className={`chip text-[10px] ${
              u.role === "admin" ? "border-amber/40 text-amber" :
              u.role === "teacher" ? "border-lime/40 text-lime" : "border-sky/40 text-sky"
            }`}>
              {u.role === "admin" ? "مدیر" : u.role === "teacher" ? "معلم" : "دانش‌آموز"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}