"use client";
import { useEffect, useState } from "react";
import { useNeutronStore, getCustomQuestions } from "@/lib/store";
import type { Quiz, Course } from "@/lib/types";

export default function QuizBuilder() {
  const questions = useNeutronStore(getCustomQuestions, []);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [serverQuizzes, setServerQuizzes] = useState<Quiz[]>([]);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [duration, setDuration] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  async function load() {
    const [r1, r2] = await Promise.all([
      fetch("/api/quizzes").then(x => x.ok ? x.json() : { quizzes: [] }),
      fetch("/api/me").then(x => x.ok ? x.json() : null),
      fetch("/api/courses").then(x => x.ok ? x.json() : { courses: [] })
    ]);
    
    const allQ = r1.quizzes ?? [];
    setServerQuizzes(allQ);

    if (r2) {
      const allC = (r2.courses as Course[]) ?? [];
      const mine = allC.filter(c => c.teacherId === r2.id || (c.availableTeachers ?? []).includes(r2.id));
      setMyCourses(mine);
      if (mine.length > 0 && !courseId) setCourseId(mine[0].id);
    }
  }

  useEffect(() => { load(); }, []);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || selected.size === 0 || !courseId) return;
    setBusy(true);
    try {
      const qs = questions.filter(q => selected.has(q.id));
      const id = "cq-" + Math.random().toString(36).slice(2, 8);
      const payload: Quiz = {
        id, title: title.trim(), courseId, durationMin: duration, questions: qs,
      };
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { 
        const d = await res.json();
        alert(d.error ?? "ساخت ناموفق."); 
        return; 
      }
      setTitle(""); setSelected(new Set());
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h2">ساخت آزمون</h1>
        <p className="text-muted text-sm mt-1">آزمون روی سرور ذخیره می‌شود.</p>
      </header>

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">عنوان آزمون</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">دوره (فقط دوره‌های من)</label>
            <select className="input" value={courseId} onChange={e => setCourseId(e.target.value)}>
              {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              {myCourses.length === 0 && <option value="">دوره‌ای ندارید</option>}
            </select>
          </div>
          <div>
            <label className="label">مدت (دقیقه)</label>
            <input type="number" min={1} className="input" value={duration}
              onChange={e => setDuration(+e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">سؤالات ({selected.size} انتخاب‌شده)</label>
          {questions.length === 0 ? (
            <p className="text-sm text-muted">اول در «بانک سؤال» چند سؤال بساز.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {questions.map(q => (
                <label key={q.id} className={`flex items-start gap-3 p-3 rounded-xl2 border cursor-pointer transition ${
                  selected.has(q.id) ? "border-lime bg-lime/10" : "border-line hover:bg-ink-3"
                }`}>
                  <input type="checkbox" checked={selected.has(q.id)}
                    onChange={() => toggle(q.id)} className="mt-1 accent-lime" />
                  <span className="text-sm">{q.prompt}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button className="btn-primary w-full" disabled={!title.trim() || selected.size === 0 || busy || myCourses.length === 0}>
          {busy ? "…" : "ساخت آزمون"}
        </button>
      </form>

      <section>
        <h2 className="font-semibold mb-3">آزمون‌های شما ({serverQuizzes.length})</h2>
        <div className="space-y-2">
          {serverQuizzes.map(q => (
            <div key={q.id} className="card">
              <div className="font-medium">{q.title}</div>
              <div className="text-xs text-muted mt-1">
                {q.questions.length} سؤال · {q.durationMin} دقیقه · دوره: {q.courseId}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}