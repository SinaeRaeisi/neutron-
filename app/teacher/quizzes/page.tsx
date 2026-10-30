"use client";
import { useState } from "react";
import { useNeutronStore, getCustomQuestions, getCustomQuizzes, addCustomQuiz, uid } from "@/lib/store";
import { courses } from "@/lib/data";

export default function QuizBuilder() {
  const questions = useNeutronStore(getCustomQuestions, []);
  const myQuizzes = useNeutronStore(getCustomQuizzes, []);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [duration, setDuration] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || selected.size === 0) return;
    const qs = questions.filter(q => selected.has(q.id));
    addCustomQuiz({ id: uid(), title: title.trim(), courseId, durationMin: duration, questions: qs });
    setTitle(""); setSelected(new Set());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">ساخت آزمون</h1>
        <p className="text-muted text-sm mt-1">
          از بانک سؤال خود آزمون بسازید. <span className="demo">DEMO</span>
        </p>
      </header>

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">عنوان آزمون</label>
          <input className="input" value={title} placeholder="مثلاً سنجش فصل ۳"
            onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">دوره</label>
            <select className="input" value={courseId}
              onChange={e => setCourseId(e.target.value)}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
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
            <p className="text-sm text-muted">ابتدا در «بانک سؤال» چند سؤال بسازید.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {questions.map(q => (
                <label key={q.id}
                  className={`flex items-start gap-3 p-3 rounded-xl2 border cursor-pointer transition ${
                    selected.has(q.id)
                      ? "border-lime bg-lime/10"
                      : "border-line hover:bg-ink-3"
                  }`}>
                  <input type="checkbox" checked={selected.has(q.id)}
                    onChange={() => toggle(q.id)} className="mt-1 accent-lime" />
                  <span className="text-sm">{q.prompt}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button className="btn-primary w-full" disabled={!title.trim() || selected.size === 0}>
          {saved ? "ساخته شد ✓" : "ساخت آزمون"}
        </button>
      </form>

      <section>
        <h2 className="font-semibold mb-3">آزمون‌های شما ({myQuizzes.length})</h2>
        <div className="space-y-2">
          {myQuizzes.map(q => (
            <div key={q.id} className="card">
              <div className="font-medium">{q.title}</div>
              <div className="text-xs text-muted mt-1">
                {q.questions.length} سؤال · {q.durationMin} دقیقه ·
                دوره: {q.courseId}
              </div>
            </div>
          ))}
          {myQuizzes.length === 0 && (
            <p className="text-muted text-sm">هنوز آزمونی نساخته‌اید.</p>
          )}
        </div>
      </section>
    </div>
  );
}