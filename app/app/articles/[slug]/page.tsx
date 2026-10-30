"use client";
import Link from "next/link";
import { Clock, Calendar, Tag } from "lucide-react";
import { getArticle, getTeacher } from "@/lib/data";

const cover = {
  lime:   "from-lime/25 via-lime/10 to-transparent border-lime/20",
  sky:    "from-sky/25 via-sky/10 to-transparent border-sky/20",
  violet: "from-violet/25 via-violet/10 to-transparent border-violet/20",
  amber:  "from-amber/25 via-amber/10 to-transparent border-amber/20",
  rose:   "from-rose/25 via-rose/10 to-transparent border-rose/20",
} as const;

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = getArticle(decodeURIComponent(params.slug));

  if (!a) {
    return (
      <div className="card text-center py-12">
        <p className="text-muted mb-4">مقاله یافت نشد.</p>
        <Link href="/app/articles" className="btn-ghost">بازگشت به مقالات</Link>
      </div>
    );
  }

  const author = getTeacher(a.authorId);
  const dateStr = new Date(a.publishedAt).toLocaleDateString("fa-IR", {
    year: "numeric", month: "long", day: "numeric",
  });

  // markdown خیلی ساده — فقط برای نمایش
  const blocks = a.content.split("\n\n");

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      <Link href="/app/articles" className="text-sm text-muted hover:text-lime">
        ← همهٔ مقالات
      </Link>

      <header>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="chip border-lime/40 text-lime bg-lime/5">{a.category}</span>
          {a.tags.map(t => (
            <span key={t} className="chip text-[10px]">
              <Tag className="w-3 h-3" />{t}
            </span>
          ))}
        </div>
        <h1 className="h1 mb-4">{a.title}</h1>
        <p className="text-lg text-muted leading-relaxed">{a.excerpt}</p>
        <div className="flex items-center gap-4 mt-5 pb-5 border-b border-line text-sm text-muted flex-wrap">
          <span className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-lime/20 text-lime flex items-center justify-center text-xs font-bold">
              {author?.name[0] ?? "?"}
            </div>
            {author?.name ?? "تیم NEUTRON"}
          </span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{dateStr}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.readMinutes} دقیقه مطالعه</span>
        </div>
      </header>

      <div className={`aspect-[21/9] rounded-xl2 bg-gradient-to-br ${cover[a.cover]} border relative overflow-hidden`}>
        <div className="absolute inset-0 surface-grid opacity-20" />
      </div>

      <div className="prose prose-invert max-w-none space-y-4">
        {blocks.map((block, i) => {
          const trimmed = block.trim();
          if (!trimmed) return null;
          if (trimmed.startsWith("# ")) {
            return <h2 key={i} className="h2 mt-8 first:mt-0">{trimmed.slice(2)}</h2>;
          }
          if (trimmed.startsWith("## ")) {
            return <h3 key={i} className="h3 mt-6 first:mt-0 text-lime">{trimmed.slice(3)}</h3>;
          }
          if (trimmed.startsWith("- ")) {
            const items = trimmed.split("\n").filter(l => l.startsWith("- ")).map(l => l.slice(2));
            return (
              <ul key={i} className="space-y-2">
                {items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-paper/90 leading-relaxed">
                    <span className="text-lime mt-1.5">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          }
          return <p key={i} className="text-paper/90 leading-loose">{trimmed}</p>;
        })}
      </div>

      <div className="card text-center py-6 !bg-gradient-to-br !from-ink-2 !to-ink-3 border-lime/20">
        <p className="text-sm text-muted mb-3">این مقاله را مفید دیدی؟</p>
        <Link href="/app/courses" className="btn-primary btn-sm inline-flex">
          دوره‌های مرتبط
        </Link>
      </div>
    </article>
  );
}