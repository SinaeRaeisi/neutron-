"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Mail, Lock, User } from "lucide-react";
import { GRADES, gradeLabel, majorsForGrade } from "@/lib/data";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState(10);
  const [major, setMajor] = useState("ریاضی");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) { setErr("رمز عبور باید حداقل ۸ کاراکتر باشد."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, grade, major }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "ثبت‌نام ناموفق."); return; }
      router.push("/app");
      router.refresh();
    } catch {
      setErr("خطای شبکه.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-mesh">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md card space-y-5">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-lime" />
          <span className="text-lime font-black tracking-widest text-sm">نوترون</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">حساب بساز.</h1>
          <p className="text-muted text-sm mt-1">در ۳۰ ثانیه شروع کن.</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">نام و نام خانوادگی</label>
            <div className="relative">
              <User className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
              <input className="input pr-10" value={name} onChange={e => setName(e.target.value)} required minLength={2} />
            </div>
          </div>
          <div>
            <label className="label">ایمیل</label>
            <div className="relative">
              <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
              <input dir="ltr" type="email" className="input pr-10 text-left" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label">رمز عبور (حداقل ۸ کاراکتر)</label>
            <div className="relative">
              <Lock className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
              <input dir="ltr" type="password" className="input pr-10 text-left" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">پایه</label>
              <select className="input" value={grade} onChange={e => {
                const g = +e.target.value;
                setGrade(g);
                const allowed = majorsForGrade(g);
                if (!allowed.includes(major)) setMajor(allowed[0]);
              }}>
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
          {err && <p className="text-danger text-sm">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "…" : "ساخت حساب"} <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        <p className="text-sm text-muted text-center">
          حساب داری؟{" "}
          <Link href="/login" className="text-lime hover:underline">وارد شو</Link>
        </p>
      </motion.div>
    </main>
  );
}