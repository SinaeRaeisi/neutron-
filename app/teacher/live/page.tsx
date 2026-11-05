"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Video, Calendar, Clock, Users, CheckCircle2, ClipboardList,
  Pencil, Trash2, X, LogIn, AlertCircle, FileText, Upload, Download,
  Loader2,
} from "lucide-react";
import { getCourse } from "@/lib/data";
import { formatIranDate, formatIranTime } from "@/lib/iran-time";
import type { LiveClass, Course, Attachment } from "@/lib/types";
interface QuizOpt { id: string; title: string; }

export default function TeacherLive() {
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [items, setItems] = useState<LiveClass[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<QuizOpt[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(90);
  const [capacity, setCapacity] = useState(100);
  const [description, setDescription] = useState("");
  const [requiredQuizId, setRequiredQuizId] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // ۱. گرفتن اطلاعات کاربر
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(m => {
      if (!m) return;
      setMe(m);
      
      // ۲. گرفتن همه دوره‌ها و فیلتر کردن فقط دوره‌های خود این معلم
      fetch("/api/courses").then(r => r.ok ? r.json() : { courses: [] }).then(d => {
        const all = (d.courses ?? []) as Course[];
        const mine = all.filter(c => c.teacherId === m.id || (c.availableTeachers ?? []).includes(m.id));
        setMyCourses(mine);
        if (mine.length > 0 && !courseId) setCourseId(mine[0].id);
      }).catch(() => {});
      
    }).catch(() => {});

    // ۳. گرفتن آزمون‌های معلم
    fetch("/api/quizzes").then(r => r.ok ? r.json() : { quizzes: [] })
      .then(d => setAllQuizzes((d.quizzes ?? []).map((q: any) => ({ id: q.id, title: q.title }))))
      .catch(() => {});

    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      const r = await fetch("/api/live-classes", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        setItems(d.classes ?? []);
      }
    } catch { /* noop */ }
  }

  function resetForm() {
    setTitle(""); setDate(""); setTime(""); setDescription("");
    setRequiredQuizId(""); setNotes(""); setAttachments([]);
    setEditingId(null); setErr(null);
  }

  function startEdit(l: LiveClass) {
    setEditingId(l.id);
    setTitle(l.title);
    setCourseId(l.courseId);
    const dt = new Date(l.scheduledAt);
    const iranDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(dt);
    const iranTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(dt);
    setDate(iranDate);
    setTime(iranTime);
    setDuration(l.durationMin);
    setCapacity(l.capacity);
    setDescription(l.description ?? "");
    setRequiredQuizId(l.requiredQuizId ?? "");
    setNotes(l.notes ?? "");
    setAttachments(l.attachments ?? []);
    setErr(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadFile(file: File) {
    setUploading(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "آپلود ناموفق."); return; }
      setAttachments(prev => [...prev, data.attachment]);
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
    if (!title.trim() || !date || !time || !courseId) {
      setErr("عنوان، دوره، تاریخ و ساعت لازم است.");
      return;
    }
    setBusy(true);
    try {
      const [y, m, d] = date.split("-").map(Number);
      const [h, min] = time.split(":").map(Number);
      const utcMs = Date.UTC(y, m - 1, d, h, min, 0) - (3 * 60 + 30) * 60 * 1000;
      const scheduledAt = new Date(utcMs).toISOString();

      const payload = {
        title: title.trim(),
        courseId,
        scheduledAt,
        durationMin: duration,
        capacity,
        description: description.trim(),
        requiredQuizId: requiredQuizId || undefined,
        notes: notes.trim(),
        attachments,
      };

      const url = editingId ? `/api/live-classes/${editingId}` : "/api/live-classes";
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
      await loadClasses();
    } catch {
      setErr("خطای شبکه.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("این کلاس حذف شود؟")) return;
    try {
      const res = await fetch(`/api/live-classes/${id}`, { method: "DELETE" });
      if (res.ok) await loadClasses();
      else alert("حذف ناموفق.");
    } catch { alert("خطای شبکه."); }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h2">{editingId ? "ویرایش کلاس" : "کلاس زنده"}</h1>
        <p className="text-muted text-sm mt-1">
          {editingId ? "تغییرات را اعمال کن." : "کلاس جدید بساز — فقط دوره‌های خودت."}
        </p>
      </header>

      {myCourses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted">دوره‌ای به تو تخصیص داده نشده. با مدیر تماس بگیر.</p>
        </div>
      ) : (
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
            <input className="input" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="مثلاً حل تمرین دلتا" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">دوره (فقط دوره‌های من)</label>
              <select className="input" value={courseId} onChange={e => setCourseId(e.target.value)}>
                {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">مدت (دقیقه)</label>
              <input type="number" min={15} max={240} className="input" value={duration}
                onChange={e => setDuration(+e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">تاریخ (ایران)</label>
              <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">ساعت (ایران)</label>
              <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">ظرفیت</label>
            <input type="number" min={1} max={10000} className="input" value={capacity}
              onChange={e => setCapacity(+e.target.value)} />
          </div>

          <div>
            <label className="label">توضیحات (اختیاری)</label>
            <textarea className="input min-h-[70px]" value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-lime" />
              یادداشت متنی جزوه (اختیاری)
            </label>
            <textarea className="input min-h-[100px]" value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="نکات کلیدی، لینک، یا متن کوتاه." />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-lime" />
              فایل‌های جزوه (PDF / ZIP / DOC — حداکثر ۲۰ مگابایت)
            </label>
            <input ref={fileRef} type="file" accept=".pdf,.zip,.doc,.docx" className="input"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
              disabled={uploading} />
            {uploading && (
              <p className="text-xs text-lime mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> در حال آپلود…
              </p>
            )}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 p-2 rounded bg-ink-3 border border-line text-xs">
                    <Download className="w-3 h-3 text-lime shrink-0" />
                    <span className="flex-1 truncate">{att.name}</span>
                    <span className="text-muted">{(att.size / 1024 / 1024).toFixed(2)}MB</span>
                    <button type="button" onClick={() => setAttachments(a => a.filter(x => x.id !== att.id))}
                      className="text-danger p-1 hover:bg-danger/10 rounded"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">آزمون پیش‌نیاز (اختیاری)</label>
            <select className="input" value={requiredQuizId}
              onChange={e => setRequiredQuizId(e.target.value)}>
              <option value="">بدون آزمون</option>
              {allQuizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
            </select>
          </div>

          {err && <p className="text-danger text-sm">{err}</p>}

          <div className="flex gap-2">
            <button className="btn-primary flex-1" disabled={busy || uploading || !title.trim() || !date || !time}>
              {ok ? <><CheckCircle2 className="w-4 h-4" /> انجام شد</> : busy ? "…" : editingId ? "ذخیره تغییرات" : "ساخت کلاس"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-ghost">انصراف</button>
            )}
          </div>
        </form>
      )}

      <section>
        <h2 className="font-semibold mb-3">کلاس‌های شما ({items.length})</h2>
        {items.length === 0 ? (
          <p className="card text-muted text-sm text-center py-6">هنوز کلاسی نساخته‌اید.</p>
        ) : (
          <div className="space-y-2">
            {items.map(l => {
              const course = getCourse(l.courseId);
              const startMs = new Date(l.scheduledAt).getTime();
              const endMs = startMs + l.durationMin * 60 * 1000;
              const canEnter = now >= startMs && now <= endMs;
              const isPast = now > endMs;

              return (
                <div key={l.id} className="card">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Video className="w-4 h-4 text-lime" />
                        <div className="font-medium">{l.title}</div>
                        {l.requiredQuizId && (
                          <span className="chip text-[10px] border-amber/40 text-amber bg-amber/10">
                            <ClipboardList className="w-3 h-3" /> پیش‌آزمون
                          </span>
                        )}
                        {(l.notes?.trim() || (l.attachments && l.attachments.length > 0)) && (
                          <span className="chip text-[10px] border-sky/40 text-sky bg-sky/10">
                            <FileText className="w-3 h-3" /> جزوه
                          </span>
                        )}
                        {isPast && <span className="chip text-[10px] border-line text-muted">پایان‌یافته</span>}
                        {canEnter && !isPast && (
                          <span className="chip text-[10px] border-danger/40 text-danger bg-danger/10 animate-pulse-soft">الان</span>
                        )}
                      </div>
                      {course && <div className="text-xs text-muted mb-1">{course.title}</div>}
                      <div className="flex flex-wrap gap-3 text-xs text-muted mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatIranDate(l.scheduledAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatIranTime(l.scheduledAt)} · {l.durationMin} دقیقه</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />ظرفیت {l.capacity}</span>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {canEnter && !isPast ? (
                        <Link href={`/teacher/live/${l.id}`} className="btn-primary btn-sm">
                          <LogIn className="w-3.5 h-3.5" /> ورود به اتاق
                        </Link>
                      ) : isPast ? (
                        <button className="btn-ghost btn-sm" disabled>پایان‌یافته</button>
                      ) : (
                        <span className="chip text-[10px] text-muted flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> در لحظهٔ شروع باز می‌شود
                        </span>
                      )}
                      <button onClick={() => startEdit(l)} className="p-1.5 text-muted hover:bg-ink-3 rounded" title="ویرایش">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(l.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}