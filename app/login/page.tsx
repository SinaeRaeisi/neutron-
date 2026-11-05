"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Mail, Lock } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "ورود ناموفق."); return; }
      const target = data.role === "admin" ? "/admin" : data.role === "teacher" ? "/teacher" : "/app";
      router.push(target);
      router.refresh();
    } catch {
      setErr("خطای شبکه.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-mesh p-10 border-l border-line relative overflow-hidden">
        <div className="absolute inset-0 surface-grid opacity-20" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-lime" />
            <span className="text-lime font-black tracking-widest">نوترون</span>
          </Link>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <h1 className="h2 mb-4">به هستهٔ یادگیری خوش آمدی.</h1>
          <p className="text-muted leading-relaxed max-w-md">مسیر یادگیری‌ات اینجا از روی داده ساخته می‌شود.</p>
        </motion.div>
        <div className="relative text-xs text-muted/60">© ۱۴۰۵ نوترون</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-lime" />
              <span className="text-lime font-black tracking-widest">نوترون</span>
            </Link>
          </div>

          <h2 className="text-2xl font-bold mb-1">خوش برگشتی.</h2>
          <p className="text-muted text-sm mb-6">با ایمیل و رمز عبورت وارد شو.</p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="label">ایمیل</label>
              <div className="relative">
                <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
                <input dir="ltr" type="email" className="input pr-10 text-left"
                  placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} autoFocus />
              </div>
            </div>
            <div>
              <label className="label">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
                <input dir="ltr" type="password" className="input pr-10 text-left"
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
            {err && <p className="text-danger text-sm">{err}</p>}
            <button type="submit" disabled={busy || !email || !password} className="btn-primary w-full">
              {busy ? "…" : "ورود"} <ArrowLeft className="w-4 h-4" />
            </button>
          </form>

          <p className="text-sm text-muted text-center mt-6">
            حساب نداری؟{" "}
            <Link href="/register" className="text-lime hover:underline">ثبت‌نام کن</Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}