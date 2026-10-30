"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Mail, RotateCcw, Check } from "lucide-react";

type Step = "email" | "code";

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  function startCooldown(sec: number) {
    setCooldown(sec);
    const t = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function requestCode() {
    setErr(null); setBusy(true);
    try {
      const res = await fetch("/api/auth/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "درخواست ناموفق.");
        if (data.cooldownLeftSec) startCooldown(data.cooldownLeftSec);
        return;
      }
      setStep("code");
      startCooldown(60);
    } catch {
      setErr("خطای شبکه.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setErr(null); setBusy(true);
    try {
      const res = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, remember }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "کد نامعتبر."); return; }
      if (data.needsRegistration) {
        router.push(`/register?email=${encodeURIComponent(data.email)}`);
        return;
      }
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative">
          <h1 className="h2 mb-4">به هستهٔ یادگیری خوش آمدی.</h1>
          <p className="text-muted leading-relaxed max-w-md">
            مسیر یادگیری‌ات اینجا از روی داده ساخته می‌شود. هر مفهوم، یک گره.
            هر گره، یک قدم به تسلط نزدیک‌تر.
          </p>
        </motion.div>
        <div className="relative text-xs text-muted/60">© ۱۴۰۵ نوترون</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-lime" />
              <span className="text-lime font-black tracking-widest">نوترون</span>
            </Link>
          </div>

          {step === "email" ? (
            <>
              <h2 className="text-2xl font-bold mb-1">ورود یا ثبت‌نام.</h2>
              <p className="text-muted text-sm mb-6">
                ایمیلت را وارد کن. کد تأیید برایت می‌فرستیم.
              </p>

              <label className="label">ایمیل</label>
              <div className="relative mb-4">
                <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted" />
                <input
                  dir="ltr"
                  type="email"
                  inputMode="email"
                  className="input pr-10 text-left"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && email.includes("@") && requestCode()}
                  autoFocus
                />
              </div>

              <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
                <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                  remember ? "bg-lime border-lime" : "border-line"
                }`}>
                  {remember && <Check className="w-3.5 h-3.5 text-ink" />}
                </span>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="sr-only" />
                <span className="text-sm text-muted">مرا به خاطر بسپار (۹۰ روز)</span>
              </label>

              <button onClick={requestCode} disabled={busy || !email.includes("@")} className="btn-primary w-full">
                {busy ? "در حال ارسال…" : "دریافت کد"}
                <ArrowLeft className="w-4 h-4" />
              </button>

              {err && <p className="text-danger text-sm mt-3">{err}</p>}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-1">کد تأیید.</h2>
              <p className="text-muted text-sm mb-6">
                کد ۶ رقمی ارسال‌شده به <span dir="ltr" className="font-mono text-paper">{email}</span> را وارد کن.
              </p>

              <label className="label">کد ۶ رقمی</label>
              <input
                dir="ltr"
                inputMode="numeric"
                maxLength={6}
                className="input text-center font-mono tracking-[0.5em] text-2xl mb-4"
                placeholder="••••••"
                value={code}
                onChange={e => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && code.length === 6 && verifyCode()}
                autoFocus
              />

              <button onClick={verifyCode} disabled={busy || code.length !== 6} className="btn-primary w-full">
                {busy ? "در حال بررسی…" : "تأیید و ورود"}
                <ArrowLeft className="w-4 h-4" />
              </button>

              {err && <p className="text-danger text-sm mt-3">{err}</p>}

              <div className="mt-4 flex gap-2">
                <button onClick={requestCode} disabled={cooldown > 0} className="btn-ghost flex-1 text-sm">
                  <RotateCcw className="w-4 h-4" />
                  {cooldown > 0 ? `${cooldown} ثانیه` : "ارسال دوباره"}
                </button>
                <button onClick={() => { setStep("email"); setCode(""); setErr(null); }} className="btn-ghost text-sm">
                  تغییر ایمیل
                </button>
              </div>
            </>
          )}

          <p className="text-xs text-muted/60 mt-6 text-center">
            با ورود، شرایط استفاده را می‌پذیری.
          </p>
        </motion.div>
      </div>
    </main>
  );
}