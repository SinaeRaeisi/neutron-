"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, Phone, Mail, MapPin, Send, CheckCircle2, User,
} from "lucide-react";
import { GRADES, gradeLabel, majorsForGrade } from "@/lib/data";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [grade, setGrade] = useState<number>(10);
  const [major, setMajor] = useState("ریاضی");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim() || !phone.trim()) {
      setErr("نام و شماره تماس لازم است.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          message: message.trim() || undefined,
          grade,
          major,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "ارسال ناموفق."); return; }
      setOk(true);
    } catch {
      setErr("خطای شبکه.");
    } finally {
      setBusy(false);
    }
  }

  if (ok) {
    return (
      <main className="min-h-dvh grid place-items-center p-6 bg-mesh">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center max-w-md space-y-4"
        >
          <CheckCircle2 className="w-16 h-16 text-ok mx-auto" />
          <h1 className="text-2xl font-bold">درخواست ثبت شد</h1>
          <p className="text-muted text-sm">تیم نوترون ظرف ۲۴ ساعت آینده با تو تماس می‌گیرد.</p>
          <Link href="/" className="btn-primary inline-flex">بازگشت به خانه</Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-ink text-paper">
      <header className="border-b border-line/60">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-lime" />
            </div>
            <span className="text-lime font-black tracking-[0.15em] text-sm">نوترون</span>
          </Link>
          <Link href="/login" className="text-sm text-muted hover:text-paper">ورود</Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14 grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-black mb-2">با ما حرف بزن</h1>
            <p className="text-muted text-sm">فرم را پر کن، تیم ما با تو تماس می‌گیرد.</p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="label">نام و نام خانوادگی</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">شماره تماس</label>
              <input
                dir="ltr"
                type="tel"
                inputMode="numeric"
                className="input text-left"
                placeholder="09xxxxxxxxx"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
            <div>
              <label className="label">ایمیل (اختیاری)</label>
              <input
                dir="ltr"
                type="email"
                className="input text-left"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">پایه</label>
                <select
                  className="input"
                  value={grade}
                  onChange={e => {
                    const g = +e.target.value;
                    setGrade(g);
                    const allowed = majorsForGrade(g);
                    if (!allowed.includes(major)) setMajor(allowed[0]);
                  }}
                >
                  {GRADES.map(g => <option key={g} value={g}>{gradeLabel(g)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">رشته</label>
                <select className="input" value={major} onChange={e => setMajor(e.target.value)}>
                  {majorsForGrade(grade).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">پیام (اختیاری)</label>
              <textarea
                className="input min-h-[80px]"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            {err && <p className="text-danger text-sm">{err}</p>}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "…" : <>ارسال درخواست <Send className="w-4 h-4" /></>}
            </button>
          </form>
        </motion.div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="font-bold mb-4">راه‌های دیگر تماس</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-lime/10 border border-lime/20 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-lime" />
                </div>
                <div>
                  <div className="text-xs text-muted">تلفن</div>
                  <div dir="ltr" className="font-mono">۰۲۱-۹۱۰۰۲۴۰۰</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-lime/10 border border-lime/20 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-lime" />
                </div>
                <div>
                  <div className="text-xs text-muted">ایمیل</div>
                  <div dir="ltr" className="font-mono text-xs">hello@neutron.ir</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-lime/10 border border-lime/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-lime" />
                </div>
                <div>
                  <div className="text-xs text-muted">دفتر</div>
                  <div>تهران، خیابان ولیعصر</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card !bg-gradient-to-br !from-ink-2 !to-ink-3 border-lime/20">
            <User className="w-6 h-6 text-lime mb-2" />
            <h3 className="font-bold mb-1">می‌خواهی همین الان شروع کنی؟</h3>
            <p className="text-xs text-muted mb-3">بدون تماس، مستقیم ثبت‌نام کن.</p>
            <Link href="/login" className="btn-ghost btn-sm">ثبت‌نام سریع</Link>
          </div>
        </div>
      </div>
    </main>
  );
}