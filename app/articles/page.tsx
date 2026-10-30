"use client";
import Link from "next/link";
import { useState } from "react";
import { Newspaper, Clock, Search, ArrowLeft, Sparkles } from "lucide-react";
import { articles, getTeacher } from "@/lib/data";

const cover = {
  lime:   "from-lime/25 to-lime/5 border-lime/20",
  sky:    "from-sky/25 to-sky/5 border-sky/20",
  violet: "from-violet/25 to-violet/5 border-violet/20",
  amber:  "from-amber/25 to-amber/5 border-amber/20",
  rose:   "from-rose/25 to-rose/5 border-rose/20",
} as const;

export default function PublicArticles() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const categories = Array.from(new Set(articles.map(a => a.category)));

  const filtered = articles.filter(a =>
    (cat === "all" || a.category === cat) &&
    (q === "" || a.title.includes(q) || a.excerpt.includes(q))
  );

  const featured = articles.find(a => a.featured);

  return (
    <div className="min-h-dvh bg-ink text-paper">
      {/* هدر */}
      <header className="sticky top-0 z-30 bg-ink/85 backdrop-blur-xl border-b border-line/60">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-lime" />
            </div>
            <span className="text-lime font-black tracking-[0.15em] text-sm">نوترون</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-paper">ورود</Link>
            <Link href="/login" className="btn-primary btn-sm">ثبت‌نام</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14 space-y-8">
        <div>
          <div className="chip border-sky/30 text-sky bg-sky/5 mb-3">
            <Newspaper className="w-3 h-3" /> مجله
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">مقالات و راهنماها</h1>
          <p className="text-muted mt-2">روش مطالعه، مفاهیم، و راهنمایی — از تیم معلم‌های نوترون.</p>
        </div>

        {/* ویژه */}
        {featured && (
          <Link href={`/articles/${featured.slug}`}
            className="block card card-hover group overflow-hidden">
            <div className="grid md:grid-cols-[1.2fr_1fr] gap-0 -m-5">
              <div className={`aspect-[16/9] md:aspect-auto bg-gradient-to-br ${cover[featured.cover]} border-l md:border-l-0 md:border-r border-line relative`}>
                <div className="absolute inset-0 surface-grid opacity-20" />
                <div className="absolute top-3 right-3 chip bg-ink/60 text-[10px]">ویژه</div>
              </div>
              <div className="p-5 md:p-7 flex flex-col justify-center">
                <div className="text-xs text-muted mb-2">
                  {featured.category} · {featured.readMinutes} دقیقه
                </div>
                <h2 className="text-xl font-bold group-hover:text-lime transition mb-2">{featured.title}</h2>
                <p className="text-sm text-muted leading-relaxed">{featured.excerpt}</p>
                <div className="mt-4 text-sm text-lime inline-flex items-center gap-1">
                  خواندن <ArrowLeft className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* فیلتر */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
            <input className="input pr-10" placeholder="جست‌وجوی مقاله…" value={q}
              onChange={e => setQ(e.target.value)} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            <button onClick={() => setCat("all")}
              className={`chip whitespace-nowrap transition ${cat === "all" ? "bg-lime text-ink border-lime" : ""}`}>
              همه
            </button>
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`chip whitespace-nowrap transition ${cat === c ? "bg-lime text-ink border-lime" : ""}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* گرید */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => {
            const author = getTeacher(a.authorId);
            return (
              <Link key={a.id} href={`/articles/${a.slug}`}
                className="card card-hover group">
                <div className={`aspect-[16/9] rounded-xl2 mb-3 bg-gradient-to-br ${cover[a.cover]} border flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 surface-grid opacity-20" />
                  <span className="absolute top-2 right-2 chip bg-ink/60 text-[10px]">{a.category}</span>
                </div>
                <h3 className="font-bold group-hover:text-lime transition line-clamp-2">{a.title}</h3>
                <p className="text-xs text-muted mt-1.5 line-clamp-2">{a.excerpt}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-muted">
                  <span>{author?.name}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.readMinutes} دقیقه</span>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-muted">مقاله‌ای با این فیلتر پیدا نشد.</p>
          </div>
        )}

        <div className="text-center pt-6 border-t border-line/60">
          <Link href="/" className="text-sm text-muted hover:text-lime">
            ← بازگشت به صفحهٔ اصلی
          </Link>
        </div>
      </main>
    </div>
  );
}