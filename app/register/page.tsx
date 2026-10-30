"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, User as UserIcon } from "lucide-react";
import { GRADES, gradeLabel, majorsForGrade } from "@/lib/data";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number>(10);
  const [major, setMajor] = useState<string>("ریاضی");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      const t = setTimeout(() => {
        if (!email) router.replace("/login");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [email, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim() || name.trim().length < 2) {
      setErr("نام حداقل ۲ حرف باشد.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grade,
          major,
          phone: phone.trim() || undefined,
        }),
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md card space-y-5"
      >
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-lime" />
            <span className="text-lime font-black tracking-widest text-sm">نوترون</span>
          </Link>
          <h1 className="text-2xl font-bold">اطلاعاتت را تکمیل کن</h1>
          <p className="text-muted text-sm mt-1">
            {email && (
              <>
                ایمیل <span dir="ltr" className="font-mono text-paper">{email}</span> تأیید شد.{" "}
              </>
            )}
            حالا بگو کی هستی تا محتوای مناسب تو را نشان دهیم.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">نام و نام خانوادگی</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="label">پایهٔ تحصیلی</label>
            <select
              className="input"
              value={grade}
              onChange={e => {
                const g = Number(e.target.value);
                setGrade(g);
                const allowed = majorsForGrade(g);
                if (!allowed.includes(major)) setMajor(allowed[0]);
              }}
            >
              {GRADES.map(g => (
                <option key={g} value={g}>{gradeLabel(g)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">رشته</label>
            <select
              className="input"
              value={major}
              onChange={e => setMajor(e.target.value)}
            >
              {majorsForGrade(grade).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1.5">
              {grade <= 9
                ? "برای پایه‌های ۶ تا ۹ رشته «عمومی» است."
                : "رشتهٔ تخصصی خودت را انتخاب کن."}
            </p>
          </div>

          <div>
            <label className="label">شمارهٔ موبایل (اختیاری)</label>
            <input
              dir="ltr"
              type="tel"
              inputMode="numeric"
              className="input text-left"
              placeholder="09xxxxxxxxx"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^\d]/g, ""))}
            />
            <p className="text-xs text-muted mt-1.5">
              برای اطلاع‌رسانی کلاس‌ها و پشتیبانی.
            </p>
          </div>

          {err && <p className="text-danger text-sm">{err}</p>}

          <button className="btn-primary w-full" disabled={busy || !name.trim()}>
            {busy ? "در حال ساخت حساب…" : "ساخت حساب و ادامه"}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-line flex items-center gap-2 text-xs text-muted">
          <UserIcon className="w-3.5 h-3.5" />
          <span>این اطلاعات بعداً در پروفایل قابل ویرایش است.</span>
        </div>
      </motion.div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh grid place-items-center p-6">
        <div className="card max-w-md w-full text-center py-12 text-muted text-sm">
          در حال بارگذاری…
        </div>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}