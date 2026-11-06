"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Plus, Trash2, FileText, Eye, Loader2, Upload, X } from "lucide-react";
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
  title: "", slug: "", excerpt: "", content: "", category: "روش مطالعه",
  cover: "lime" as "lime" | "sky" | "violet" | "amber" | "rose",
  coverImage: "", readMinutes: 5, tagsRaw: "", featured: false,
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<(Article & { isSeed?: boolean })[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const r = await fetch("/api/admin/articles");
      if (r.ok) setArticles((await r.json()).articles ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm(emptyForm); setEditingSlug(null); setShowForm(false); setErr(null);
  }

  function startEdit(a: Article) {
    setEditingSlug(a.slug);
    setForm({
      title: a.title, slug: a.slug, excerpt: a.excerpt, content: a.content,
      category: a.category, cover: a.cover, coverImage: a.coverImage || "",
      readMinutes: a.readMinutes, tagsRaw: a.tags.join(", "), featured: !!a.featured,
    });
    setShowForm(true); setErr(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImage(file: File) {
    setUploading(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "آپلود ناموفق."); return; }
      setForm(f => ({ ...f, coverImage: data.attachment.url }));
    } catch {
      setErr("خطای شبکه در آپلود.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
      const payload = { ...form, tags };
      
      const url = editingSlug ? `/api/admin/articles/${editingSlug}` : "/api/admin/articles";
      const method = editingSlug ? "PUT" : "POST";

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "خطا."); return; }
      resetForm(); setOk(true);
      setTimeout(() => setOk(false), 1500);
      await load();
    } finally { setBusy(false); }
  }

  async function remove(slug: string, isSeed?: boolean) {
    if (!confirm("این مقاله حذف شود؟")) return;
    const res = await fetch(`/api/admin/articles/${slug}`, { method: "DELETE" });
    if (res.ok) await load();
    else alert("حذف ناموفق.");
  }

  const filtered = articles.filter(a => !filter || a.title.includes(filter) || a.category.includes(filter));

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="chip border-sky/30 text-sky bg-sky/5 mb-3">
            <FileText className="w-3 h-3" /> مقالات
          </div>
          <h1 className="h2">مدیریت مقالات</h1>
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
            <h2 className="font-bold">{editingSlug ? "ویرایش مقاله" : "مقاله جدید"}</h2>
            <button type="button" onClick={resetForm} className="p-1.5 hover:bg-ink-3 rounded"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">عنوان</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">آدرس (Slug - انگلیسی)</label>
              <input className="input" dir="ltr" placeholder="my-article-slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">خلاصه (زیر عنوان)</label>
            <textarea className="input min-h-[60px]" value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="label">دسته</label>
              <input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            </div>
            <div>
              <label className="label">زمان مطالعه</label>
              <input type="number" min={1} className="input" value={form.readMinutes} onChange={e => setForm(f => ({ ...f, readMinutes: +e.target.value }))} />
            </div>
            <div>
              <label className="label">رنگ پشتیبان</label>
              <select className="input" value={form.cover} onChange={e => setForm(f => ({ ...f, cover: e.target.value as any }))}>
                <option value="lime">سبز</option><option value="sky">آبی</option><option value="violet">بنفش</option><option value="amber">نارنجی</option><option value="rose">صورتی</option>
              </select>
            </div>
            <div>
              <label className="label">ویژه</label>
              <label className="flex items-center gap-2 h-10 px-3 rounded-xl2 bg-ink-3 border border-line cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                <span className="text-sm">کارت ویژه</span>
              </label>
            </div>
          </div>

          <div>
            <label className="label">عکس کاور (اختیاری)</label>
            <input ref={fileRef} type="file" accept="image/*" className="input" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} disabled={uploading} />
            {uploading && <p className="text-xs text-lime mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> در حال آپلود...</p>}
            {form.coverImage && (
              <div className="mt-2 relative w-full max-w-xs">
                <img src={form.coverImage} alt="cover" className="w-full rounded-xl2 border border-line" />
                <button type="button" onClick={() => setForm(f => ({ ...f, coverImage: "" }))} className="absolute -top-2 -right-2 bg-danger text-paper rounded-full p-1"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>

          <div>
            <label className="label">برچسب‌ها (با کاما)</label>
            <input className="input" value={form.tagsRaw} onChange={e => setForm(f => ({ ...f, tagsRaw: e.target.value }))} />
          </div>

          <div>
            <label className="label">متن مقاله</label>
            <MarkdownEditor value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))} />
          </div>

          {err && <p className="text-danger text-sm bg-danger/10 p-2 rounded">{err}</p>}
          {ok && <p className="text-lime text-sm bg-lime/10 p-2 rounded">ذخیره شد.</p>}

          <button className="btn-primary w-full" disabled={busy || uploading}>{busy ? "..." : editingSlug ? "ذخیره تغییرات" : "انتشار مقاله"}</button>
        </form>
      )}

      <div className="space-y-2 mt-6">
        {filtered.map(a => (
          <div key={a.slug} className="card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
               {a.coverImage ? <img src={a.coverImage} className="w-16 h-10 rounded object-cover border border-line" /> : <div className={`w-16 h-10 rounded bg-gradient-to-br ${cover[a.cover]} border`} />}
               <div>
                 <div className="font-bold text-sm">{a.title}</div>
                 <div className="text-xs text-muted mt-1">{a.slug} · {a.readMinutes} دقیقه</div>
               </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(a)} className="p-2 text-lime hover:bg-lime/10 rounded"><FileText className="w-4 h-4" /></button>
              <button onClick={() => remove(a.slug, a.isSeed)} className="p-2 text-danger hover:bg-danger/10 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}