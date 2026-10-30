"use client";
import { useEffect, useRef, useState } from "react";
import { Star, ChevronLeft, ChevronRight, Send, CheckCircle2, Quote } from "lucide-react";
import type { Testimonial } from "@/lib/types";

/** دادهٔ seed حذف شده — فقط نظرات واقعی از API نمایش داده می‌شوند */
const seedTestimonials: Testimonial[] = [];

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>(seedTestimonials);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", text: "", rating: 5 });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const r = await fetch("/api/testimonials");
      if (r.ok) {
        const d = await r.json();
        setItems(d.testimonials ?? []);
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function scrollPrev() {
    scrollRef.current?.scrollBy({ left: 400, behavior: "smooth" });
  }
  function scrollNext() {
    scrollRef.current?.scrollBy({ left: -400, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { alert("ارسال ناموفق."); return; }
      setSent(true);
      setShowForm(false);
      setForm({ name: "", role: "", text: "", rating: 5 });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="py-16 md:py-24 bg-ink-2/30 border-y border-line/60">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <div className="text-xs text-rose font-bold tracking-widest mb-2">نظرها</div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">دانش‌آموزان چه می‌گویند</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowForm(true)} className="btn-primary btn-sm">
              <Star className="w-3.5 h-3.5" /> نظرت را ثبت کن
            </button>
            <button onClick={scrollPrev} className="p-2 rounded-full border border-line hover:bg-ink-3 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={scrollNext} className="p-2 rounded-full border border-line hover:bg-ink-3 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={submit} className="card mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">نظرت را ثبت کن</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-muted hover:text-paper">✕</button>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <input className="input" placeholder="نام" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className="input" placeholder="نقش (دانش‌آموز، مادر، ...)" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <textarea className="input min-h-[80px]" placeholder="نظرت دربارهٔ نوترون…"
              value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">امتیاز:</span>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}>
                  <Star className={`w-5 h-5 transition ${n <= form.rating ? "text-amber fill-amber" : "text-ink-4"}`} />
                </button>
              ))}
            </div>
            {sent && (
              <p className="text-ok text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> نظرت ثبت شد
              </p>
            )}
            <button className="btn-primary" disabled={busy}>
              {busy ? "…" : <><Send className="w-4 h-4" /> ارسال</>}
            </button>
          </form>
        )}

        {loading ? (
          <div className="card text-center py-12 text-muted text-sm">…</div>
        ) : items.length === 0 ? (
          <div className="card text-center py-10">
            <Quote className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm">هنوز نظری ثبت نشده. اولین نفر باش!</p>
          </div>
        ) : (
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
            {items.map(t => (
              <div key={t.id} className="snap-start shrink-0 w-[320px] md:w-[360px] card relative">
                <Quote className="w-8 h-8 text-lime/20 absolute top-4 left-4" />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-amber fill-amber" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-paper/90 min-h-[5rem]">{t.text}</p>
                <div className="mt-4 pt-3 border-t border-line/60">
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}