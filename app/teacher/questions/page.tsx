"use client";
import { useState } from "react";
import { useNeutronStore, getCustomQuestions, addCustomQuestion, uid } from "@/lib/store";
import { concepts } from "@/lib/data";
import type { Question } from "@/lib/types";

export default function Questions() {
  const custom = useNeutronStore(getCustomQuestions, []);
  const [form, setForm] = useState<Question>({
    id: "", prompt: "", options: ["", "", "", ""],
    answer: 0, conceptId: "c1", weight: 1,
  });
  const [saved, setSaved] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.prompt.trim() || form.options.some(o => !o.trim())) return;
    addCustomQuestion({ ...form, id: uid() });
    setSaved(true);
    setForm({ id: "", prompt: "", options: ["", "", "", ""], answer: 0, conceptId: "c1", weight: 1 });
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">بانک سؤال</h1>
        <p className="text-muted text-sm mt-1">
          سؤالات در این مرورگر نگه داشته می‌شوند. <span className="demo">DEMO</span>
        </p>
      </header>

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">متن سؤال</label>
          <input className="input" value={form.prompt}
            onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {form.options.map((o, i) => (
            <input key={i} className="input" placeholder={`گزینهٔ ${i + 1}`} value={o}
              onChange={e => {
                const opts = [...form.options]; opts[i] = e.target.value;
                setForm(f => ({ ...f, options: opts }));
              }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="label">گزینهٔ درست</label>
            <select className="input" value={form.answer}
              onChange={e => setForm(f => ({ ...f, answer: +e.target.value }))}>
              {form.options.map((_, i) => <option key={i} value={i}>{i + 1}</option>)}
            </select>
          </div>
          <div>
            <label className="label">مفهوم</label>
            <select className="input" value={form.conceptId}
              onChange={e => setForm(f => ({ ...f, conceptId: e.target.value }))}>
              {concepts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">وزن</label>
            <input type="number" min={1} max={5} className="input" value={form.weight}
              onChange={e => setForm(f => ({ ...f, weight: +e.target.value }))} />
          </div>
        </div>
        <button className="btn-primary w-full" type="submit">
          {saved ? "ذخیره شد ✓" : "افزودن سؤال"}
        </button>
      </form>

      <section>
        <h2 className="font-semibold mb-3">سؤالات شما ({custom.length})</h2>
        <div className="space-y-2">
          {custom.map(q => (
            <div key={q.id} className="card">
              <p className="font-medium">{q.prompt}</p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted">
                <span className="chip">پاسخ: {q.options[q.answer]}</span>
                <span className="chip">مفهوم: {q.conceptId}</span>
                <span className="chip">وزن: {q.weight}</span>
              </div>
            </div>
          ))}
          {custom.length === 0 && <p className="text-muted text-sm">هنوز سؤالی نساخته‌اید.</p>}
        </div>
      </section>
    </div>
  );
}