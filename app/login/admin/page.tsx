"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Mail, Lock, Shield } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "ورود ناموفق."); return; }
      router.push("/admin");
      router.refresh();
    } catch {
      setErr("خطای شبکه.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-mesh">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm card space-y-5">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-lime" />
            <span className="text-lime font-black tracking-widest">نوترون</span>
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-amber" />
            <h1 className="text-xl font-bold">ورود مدیر</h1>
          </div>
          <p className="text-muted text-sm">با ایمیل و رمز عبور اختصاصی.</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">ایمیل مدیر</label>
            <div className="relative">
              <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
              <input
                dir="ltr" type="email" className="input pr-10 text-left"
                value={email} onChange={e => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="label">رمز عبور</label>
            <div className="relative">
              <Lock className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
              <input
                dir="ltr" type="password" className="input pr-10 text-left"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          {err && <p className="text-danger text-sm">{err}</p>}
          <button className="btn-primary w-full" disabled={busy || !email || !password}>
            {busy ? "…" : "ورود"} <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-3 border-t border-line">
          <Link href="/login" className="text-xs text-muted hover:text-lime">
            ← بازگشت به ورود عادی
          </Link>
        </div>
      </motion.div>
    </main>
  );
}