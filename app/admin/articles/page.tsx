"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Trash2, FileText, Eye, Pencil, X, Search,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { formatIranDate } from "@/lib/iran-time";
import type { Article } from "@/lib/types";

const cover = {
  lime: "from-lime/25 to-lime/5 border-lime/20",
  sky: "from-sky/25 to-sky/5 border-sky/20",
  violet: "from-violet/25 to-violet/5 border-violet/20",
  amber: "from-amber/25 to-amber/5 border-amber/20",
  rose: "from-rose/25 to-rose/5 border-rose/20",
} as const;

const emptyForm = {
  title: "", excerpt: "", content: "", category: "روش مطالعه",
  cover: "lime" as "lime" | "sky" | "violet" | "amber" | "rose",
  readMinutes: 5, tagsRaw: "", featured: false,
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<(Article & { isSeed?: boolean })[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/admin/articles");
      if (r.ok) {
        const d = await r.json();
        setArticles(d.articles ?? []);
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingSlug(null);
    setShowForm(false);
    setErr(null);
  }

  function startEdit(a: Article & { isSeed?: boolean }) {
    setEditingSlug(a.slug);
    setForm({
      title: a.title,
      excerpt: a.excerpt,
      content: a.content,
      category: a.category,
      cover: a.cover,
      readMinutes: a.readMinutes,
      tagsRaw: a.tags.join(", "),
      featured: !!a.featured,
    });
    setShowForm(true);
    setErr(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      setErr("عنوان، خلاصه و متن لازم است."); return;
    }
    setBusy(true);
    try {
      const tags = form.tagsRaw.split(/[,،]/).map(t => t.trim()).filter(Boolean);
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        category: form.category.trim(),
        cover: form.cover,
        readMinutes: form.readMinutes,
        tags,
        featured: form.featured,
      };

      const url = editingSlug ? `/api/admin/articles/${editingSlug}` : "/api/admin/articles";
      const method = editingSlug ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "خطا."); return; }
      resetForm();
      setOk(true);
      setTimeout(() => setOk(false), 1500);
      await load();
    } finally { setBusy(false); }
  }

  async function remove(slug: string, isSeed?: boolean) {
    const msg = isSeed
      ? "این مقاله از نسخهٔ پیش‌فرض حذف شود؟ (قابل بازگردانی با پاک کردن DB)"
      : "این مقاله برای همیشه حذف شود؟";
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/admin/articles/${slug}`, { method: "DELETE" });
      if (res.ok) await load();
      else alert("حذف ناموفق.");
    } catch { alert("خطای شبکه."); }
  }

  const filtered = articles.filter(a =>
    !filter || a.title.includes(filter) || a.category.includes(filter)
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="chip border-sky/30 text-sky bg-sky/5 mb-3">
            <FileText className="w-3 h-3" /> مقالات
          </div>
          <h1 className="h2">مدیریت مقالات</h1>
          <p className="text-muted text-sm mt-1">
            {articles.length.toLocaleString("fa-IR")} مقاله — می‌توانی ویرایش کنی، حذف کنی، یا مقاله بنویسی.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> مقاله جدید
          </button>
        )}
      </header>

      {showForm && (
        <form onSubmit={submit} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">
              {editingSlug ? "ویرایش مقاله" : "مقاله جدید"}
            </h2>
            <button type="button" onClick={resetForm} className="p-1.5 hover:bg-ink-3 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="label">عنوان</label>
            <input className="input" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div>
            <label className="label">خلاصه (زیر عنوان در کارت‌ها)</label>
            <textarea className="input min-h-[60px]" value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="label">دسته</label>
              <input className="input" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            </div>
            <div>
              <label className="label">زمان مطالعه</label>
              <input type="number" min={1} className="input" value={form.readMinutes}
                onChange={e => setForm(f => ({ ...f, readMinutes: +e.target.value }))} />
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
            <div>
              <label className="label">ویژه</label>
              <label className="flex items-center gap-2 h-10 px-3 rounded-xl2 bg-ink-3 border border-line cursor-pointer">
                <input type="checkbox" checked={form.featured}
                  onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                <span className="text-sm">در کارت ویژه</span>
              </label>
            </div>
          </div>

          <div>
            <label className="label">برچسب‌ها (با کاما)</label>
            <input className="input" value={form.tagsRaw}
              onChange={e => setForm(f => ({ ...f, tagsRaw: e.target.value }))}
              placeholder="ریاضی، روش مطالعه، کنکور" />
          </div>

          <div>
            <label className="label">متن مقاله</label>
            <MarkdownEditor
              value={form.content}
              onChange={v => setForm(f => ({ ...f, content: v }))}
            />
          </div>

          {err && <p className="text-danger text-sm bg-danger/10 p-2 rounded flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> {err}
          </p>}
          {ok && <p className="text-lime text-sm bg-lime/10 p-2 rounded flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> ذخیره شد
          </p>}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "…" : editingSlug ? "ذخیره تغییرات" : "انتشار"}
          </button>
        </form>
      )}

      <div className="relative">
        <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
        <input className="input pr-10" placeholder="جست‌وجو در عنوان یا دسته…"
          value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      {loading ? (
        <div className="card text-center py-8 text-muted text-sm">…</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">مقاله‌ای یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.slug} className="card">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${cover[a.cover]} border shrink-0 relative`}>
                  {a.featured && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber rounded-full text-[8px] flex items-center justify-center text-ink font-bold">★</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="chip text-[10px]">{a.category}</span>
                    {a.isSeed && <span className="chip text-[10px] border-line text-muted">پیش‌فرض</span>}
                    {a.featured && <span className="chip text-[10px] border-amber/40 text-amber">ویژه</span>}
                  </div>
                  <div className="font-medium text-sm truncate">{a.title}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {formatIranDate(a.publishedAt)} · {a.readMinutes} دقیقه
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Link href={`/articles/${a.slug}`} target="_blank"
                    className="p-2 text-muted hover:bg-ink-3 rounded" title="مشاهده">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button onClick={() => startEdit(a)}
                    className="p-2 text-lime hover:bg-lime/10 rounded" title="ویرایش">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(a.slug, a.isSeed)}
                    className="p-2 text-danger hover:bg-danger/10 rounded" title="حذف">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}