"use client";
import { useEffect, useState } from "react";
import { Trophy, Plus, X, Trash2, Pencil, ChevronDown, CheckCircle2 } from "lucide-react";
import { GRADES, MAJORS, gradeLabel } from "@/lib/data";
import { formatIranDate, formatIranTime } from "@/lib/iran-time";
import type { MockExam, Question } from "@/lib/types";

const blankForm = {
  title: "", grade: 12, major: "تجربی",
  date: "", time: "", durationMin: 240,
  capacity: 1000, fee: 0,
  subjectsRaw: "ریاضی,فیزیک",
  description: "",
};

export default function AdminMockExams() {
  const [items, setItems] = useState<MockExam[]>([]);
  const [form, setForm] = useState(blankForm);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/mock-exams-admin");
      if (r.ok) {
        const d = await r.json();
        setItems(d.exams ?? []);
      }
    } catch { /* noop */ }
  }
  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm(blankForm);
    setQuestions([]);
    setEditingId(null);
    setErr(null);
  }

  function startEdit(m: MockExam) {
    setEditingId(m.id);
    const dt = new Date(m.scheduledAt);
    const iranDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(dt);
    const iranTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(dt);
    setForm({
      title: m.title,
      grade: Number(m.grade),
      major: m.major,
      date: iranDate,
      time: iranTime,
      durationMin: m.durationMin,
      capacity: m.capacity,
      fee: m.fee,
      subjectsRaw: (m.subjects ?? []).join(","),
      description: m.description ?? "",
    });
    setQuestions((m.questions ?? []).map(q => ({ ...q })));
    setErr(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addQuestion() {
    setQuestions([...questions, {
      id: "q" + Math.random().toString(36).slice(2, 8),
      prompt: "", options: ["", "", "", ""], answer: 0,
      conceptId: "c1", weight: 1,
    }]);
  }
  function updateQ(idx: number, patch: Partial<Question>) {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, ...patch } : q));
  }
  function removeQ(idx: number) {
    setQuestions(questions.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.title.trim() || !form.date || !form.time) {
      setErr("عنوان، تاریخ و ساعت را پر کن.");
      return;
    }
    if (questions.length === 0) { setErr("حداقل یک سؤال بساز."); return; }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) { setErr(`سؤال ${i + 1}: متن خالی.`); return; }
      if (q.options.some(o => !o.trim())) { setErr(`سؤال ${i + 1}: گزینه‌های خالی.`); return; }
    }

    setBusy(true);
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [h, min] = form.time.split(":").map(Number);
      const utcMs = Date.UTC(y, m - 1, d, h, min, 0) - (3 * 60 + 30) * 60 * 1000;
      const scheduledAt = new Date(utcMs).toISOString();

      const subjects = form.subjectsRaw.split(/[,،]/).map(s => s.trim()).filter(Boolean);
      const payload = {
        title: form.title.trim(),
        grade: form.grade,
        major: form.major,
        scheduledAt,
        durationMin: form.durationMin,
        questionCount: questions.length,
        capacity: form.capacity,
        subjects: subjects.length > 0 ? subjects : ["عمومی"],
        description: form.description.trim(),
        fee: form.fee,
        questions,
      };

      const url = editingId ? `/api/mock-exams-admin/${editingId}` : "/api/mock-exams-admin";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error ?? "عملیات ناموفق."); return; }
      resetForm();
      setOk(true);
      setTimeout(() => setOk(false), 2000);
      await load();
    } catch {
      setErr("خطای شبکه.");
    } finally {
      setBusy(false);
    }
  }

  async function removeExam(id: string) {
    if (!confirm("این آزمون و نتایجش حذف شود؟")) return;
    try {
      const res = await fetch(`/api/mock-exams-admin/${id}`, { method: "DELETE" });
      if (res.ok) await load();
      else alert("حذف ناموفق.");
    } catch { alert("خطای شبکه."); }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h2">{editingId ? "ویرایش آزمون" : "مدیریت آزمون آزمایشی"}</h1>
        <p className="text-muted text-sm mt-1">آزمون بساز، ویرایش کن، حذف کن.</p>
      </header>

      <form onSubmit={submit} className="card space-y-4">
        {editingId && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-amber/10 border border-amber/30">
            <span className="text-xs text-amber flex items-center gap-1">
              <Pencil className="w-3 h-3" /> حالت ویرایش
            </span>
            <button type="button" onClick={resetForm} className="text-xs text-amber hover:underline">
              <X className="w-3 h-3 inline" /> انصراف
            </button>
          </div>
        )}

        <div>
          <label className="label">عنوان</label>
          <input className="input" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
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
            <label className="label">تاریخ (ایران)</label>
            <input type="date" className="input" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="label">ساعت (ایران)</label>
            <input type="time" className="input" value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="label">مدت</label>
            <input type="number" className="input" value={form.durationMin}
              onChange={e => setForm(f => ({ ...f, durationMin: +e.target.value }))} />
          </div>
          <div>
            <label className="label">ظرفیت</label>
            <input type="number" className="input" value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} />
          </div>
          <div>
            <label className="label">هزینه (تومان)</label>
            <input type="number" className="input" value={form.fee}
              onChange={e => setForm(f => ({ ...f, fee: +e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="label">دروس (با کاما)</label>
          <input className="input" value={form.subjectsRaw}
            onChange={e => setForm(f => ({ ...f, subjectsRaw: e.target.value }))} />
        </div>

        <div>
          <label className="label">توضیحات (اختیاری)</label>
          <textarea className="input min-h-[60px]" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label !mb-0">سؤالات ({questions.length})</label>
            <button type="button" onClick={addQuestion} className="btn-ghost btn-sm">
              <Plus className="w-3 h-3" /> افزودن
            </button>
          </div>
          {questions.length === 0 && (
            <p className="text-xs text-muted text-center py-4">حداقل ۱ سؤال لازم است.</p>
          )}
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={q.id} className="card !bg-ink-3 space-y-2 !p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted font-semibold">سؤال {i + 1}</span>
                  <button type="button" onClick={() => removeQ(i)} className="text-danger p-1"><X className="w-3 h-3" /></button>
                </div>
                <input className="input text-sm" placeholder="متن سؤال" value={q.prompt}
                  onChange={e => updateQ(i, { prompt: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((o, oi) => (
                    <input key={oi} className="input text-sm" placeholder={`گزینهٔ ${oi + 1}`} value={o}
                      onChange={e => {
                        const opts = [...q.options]; opts[oi] = e.target.value;
                        updateQ(i, { options: opts });
                      }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted">پاسخ:</label>
                  <select className="input !py-1 !px-2 text-xs w-auto" value={q.answer}
                    onChange={e => updateQ(i, { answer: +e.target.value })}>
                    {q.options.map((_, oi) => <option key={oi} value={oi}>گزینهٔ {oi + 1}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {err && <p className="text-danger text-sm bg-danger/10 p-2 rounded">{err}</p>}
        {ok && <p className="text-lime text-sm bg-lime/10 p-2 rounded flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> انجام شد</p>}

        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={busy}>
            {busy ? "…" : editingId ? "ذخیره تغییرات" : "ساخت آزمون"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-ghost">انصراف</button>
          )}
        </div>
      </form>

      <section>
        <h2 className="font-bold mb-3">آزمون‌ها ({items.length})</h2>
        {items.length === 0 ? (
          <p className="card text-sm text-muted text-center py-6">هنوز آزمونی نساخته‌اید.</p>
        ) : (
          <div className="space-y-2">
            {items.map(m => {
              const isOpen = expandedId === m.id;
              return (
                <div key={m.id} className="card">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <button onClick={() => setExpandedId(isOpen ? null : m.id)}
                      className="flex-1 text-right min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Trophy className="w-4 h-4 text-amber shrink-0" />
                        <span className="font-medium text-sm truncate">{m.title}</span>
                      </div>
                      <div className="text-xs text-muted flex items-center gap-2 flex-wrap">
                        <span className="chip text-[10px]">پایهٔ {gradeLabel(m.grade)} · {m.major}</span>
                        <span>{formatIranDate(m.scheduledAt)} · {formatIranTime(m.scheduledAt)}</span>
                        <span>· {m.questionCount ?? m.questions?.length ?? 0} سؤال</span>
                      </div>
                    </button>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setExpandedId(isOpen ? null : m.id)} className="p-1.5 text-muted hover:bg-ink-3 rounded">
                        <ChevronDown className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      <button onClick={() => startEdit(m)} className="p-1.5 text-muted hover:bg-ink-3 rounded" title="ویرایش">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeExam(m.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-line space-y-2 text-xs">
                      {m.description && <div><b className="text-paper">توضیحات:</b> <span className="text-muted">{m.description}</span></div>}
                      <div><b className="text-paper">ظرفیت:</b> <span className="text-muted">{m.capacity.toLocaleString("fa-IR")} · هزینه: {m.fee.toLocaleString("fa-IR")} تومان</span></div>
                      {m.questions && m.questions.length > 0 && (
                        <div className="space-y-1 mt-2">
                          <b className="text-paper">سؤالات:</b>
                          {m.questions.map((q, i) => (
                            <div key={q.id} className="bg-ink-3/50 p-2 rounded">
                              <span className="text-muted">{i + 1}.</span> {q.prompt}
                              <span className="text-lime mr-2">(پاسخ: {q.options[q.answer]})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}