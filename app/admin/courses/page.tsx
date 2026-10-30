"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { GRADES, MAJORS, gradeLabel, getTeacher } from "@/lib/data";
import { users } from "@/lib/data";
import type { Course } from "@/lib/types";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({
    title: "", subject: "ریاضی", grade: 10, major: "ریاضی",
    teacherId: "", summary: "", level: "پایه" as "پایه" | "متوسط" | "پیشرفته",
    cover: "lime" as "lime" | "sky" | "violet" | "amber" | "rose",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const teachers = users.filter(u => u.role === "teacher");

  async function load() {
    const r = await fetch("/api/admin/courses").then(x => x.ok ? x.json() : { courses: [] });
    setCourses(r.courses ?? []);
  }
  useEffect(() => {
    load();
    setForm(f => ({ ...f, teacherId: teachers[0]?.id ?? "" }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.title.trim() || !form.summary.trim() || !form.teacherId) {
      setErr("عنوان، توضیح و مدرس لازم است."); return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "خطا."); return; }
      setForm({ ...form, title: "", summary: "" });
      await load();
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm("حذف شود؟")) return;
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="chip border-lime/30 text-lime bg-lime/5 mb-3">
          <GraduationCap className="w-3 h-3" /> دوره‌ها
        </div>
        <h1 className="h2">مدیریت دوره‌ها</h1>
        <p className="text-muted text-sm mt-1">دوره‌های جدید به لیست دانش‌آموزان اضافه می‌شوند.</p>
      </header>

      <form onSubmit={submit} className="card space-y-3">
        <div>
          <label className="label">عنوان دوره</label>
          <input className="input" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">درس</label>
            <input className="input" value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
          <div>
            <label className="label">مدرس</label>
            <select className="input" value={form.teacherId}
              onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">پایه</label>
            <select className="input" value={form.grade}
              onChange={e => setForm(f => ({ ...f, grade: +e.target.value }))}>
              {GRADES.map(g => <option key={g} value={g}>{gradeLabel(g)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">رشته</label>
            <select className="input" value={form.major}
              onChange={e => setForm(f => ({ ...f, major: e.target.value }))}>
              {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">سطح</label>
            <select className="input" value={form.level}
              onChange={e => setForm(f => ({ ...f, level: e.target.value as any }))}>
              <option value="پایه">پایه</option>
              <option value="متوسط">متوسط</option>
              <option value="پیشرفته">پیشرفته</option>
            </select>
          </div>
          <div>
            <label className="label">رنگ</label>
            <select className="input" value={form.cover}
              onChange={e => setForm(f => ({ ...f, cover: e.target.value as any }))}>
              <option value="lime">سبز</option>
              <option value="sky">آبی</option>
              <option value="violet">بنفش</option>
              <option value="amber">نارنجی</option>
              <option value="rose">صورتی</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">توضیح کوتاه</label>
          <textarea className="input min-h-[60px]" value={form.summary}
            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} />
        </div>
        {err && <p className="text-danger text-sm">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "…" : <><Plus className="w-4 h-4" /> ساخت دوره</>}
        </button>
      </form>

      <section>
        <h2 className="font-bold mb-3">دوره‌های اضافه‌شده ({courses.length})</h2>
        {courses.length === 0 ? (
          <p className="card text-center py-6 text-muted text-sm">هنوز دوره‌ای نساخته‌اید.</p>
        ) : (
          <div className="space-y-2">
            {courses.map(c => (
              <div key={c.id} className="card flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm">{c.title}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {c.subject} · {gradeLabel(c.grade)} · {getTeacher(c.teacherId)?.name}
                  </div>
                </div>
                <button onClick={() => remove(c.id)} className="text-danger p-1.5 hover:bg-danger/10 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}