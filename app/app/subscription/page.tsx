"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Calendar, Zap, Shield, Upload, Loader2, CreditCard, X, Clock } from "lucide-react";
import { plans, durations, calcPrice, planName, type PlanId } from "@/lib/plans";
import type { Subscription, PendingPayment } from "@/lib/types";
import { gradeLabel } from "@/lib/data";

interface Me {
  name: string; role: string; grade?: number; major?: string;
  subscription: Subscription | null;
}

interface BankInfo {
  cardNumber: string; cardOwner: string; bankName: string; sheba: string;
}

interface CheckoutData {
  payment: { id: string; plan: string; planName: string; months: number; price: number };
  bank: BankInfo;
}

const colorMap = {
  sky:    { bg: "bg-sky/10",    border: "border-sky/30",    text: "text-sky",    glow: "" },
  lime:   { bg: "bg-lime/10",   border: "border-lime/40",   text: "text-lime",   glow: "glow-lime" },
  violet: { bg: "bg-violet/10", border: "border-violet/30", text: "text-violet", glow: "" },
} as const;

const iconMap = { basic: Sparkles, pro: Crown, vip: Zap };

export default function SubscriptionPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [months, setMonths] = useState<1 | 3 | 6>(1);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadMe() {
    const data = await fetch("/api/me").then(r => r.ok ? r.json() : null).catch(() => null);
    setMe(data);
    return data;
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function startCheckout(planId: PlanId) {
    setBusy(planId);
    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, months }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "خطا در شروع پرداخت."); return; }
      setCheckout(data);
    } finally {
      setBusy(null);
    }
  }

  async function uploadReceipt(file: File) {
    if (!checkout) return;
    setUploading(true);
    setUploadErr(null);
    try {
      // آپلود فایل
      const fd = new FormData();
      fd.append("file", file);
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) { setUploadErr(upData.error ?? "آپلود ناموفق."); return; }

      // ثبت رسید
      const res = await fetch("/api/payment/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: checkout.payment.id,
          receiptUrl: upData.attachment.url,
          receiptName: upData.attachment.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setUploadErr(data.error ?? "ثبت رسید ناموفق."); return; }

      setPendingPayment(data.payment);
      setCheckout(null);
      await loadMe();
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setUploadErr("خطای شبکه.");
    } finally {
      setUploading(false);
    }
  }

  const active = me?.subscription;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header>
        <div className="chip border-lime/30 text-lime bg-lime/5 mb-3">
          <Crown className="w-3 h-3" /> اشتراک
        </div>
        <h1 className="h2">اشتراک نوترون</h1>
        <p className="text-muted text-sm mt-1">
          یک‌بار بخر، همهٔ محتوای پایه و رشتهٔ خودت رایگان است — تا پایان دوره.
        </p>
      </header>

      {me && !me.grade && (
        <div className="card border-danger/40 bg-danger/5 text-sm">
          <b className="text-danger">توجه:</b> اول پایه و رشته‌ات را در پروفایل تکمیل کن.
        </div>
      )}

      {/* اشتراک فعال */}
      {active && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card border-lime/40 bg-lime/5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl2 bg-lime text-ink flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-lime font-semibold">اشتراک فعال</div>
                <div className="font-bold text-lg">{planName[active.plan]}</div>
                <div className="text-xs text-muted mt-0.5">
                  پایهٔ {active.grade ? gradeLabel(active.grade) : "?"} · {active.major}
                </div>
              </div>
            </div>
            <div className="text-left">
              <div className="text-xs text-muted flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3" /> تا
              </div>
              <div className="text-sm font-bold">
                {new Date(active.expiresAt).toLocaleDateString("fa-IR", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* پرداخت در انتظار بررسی */}
      {pendingPayment && pendingPayment.status === "pending_review" && (
        <div className="card border-amber/40 bg-amber/5">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber">رسید شما در حال بررسی است</div>
              <p className="text-sm text-muted mt-1">
                پرداخت {planName[pendingPayment.plan as PlanId]} — {pendingPayment.months} ماه.
                تیم پشتیبانی ظرف حداکثر ۲۴ ساعت تأیید می‌کند.
              </p>
              <p className="text-xs text-muted mt-2">شمارهٔ پیگیری: <span className="font-mono text-paper">{pendingPayment.id}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* فرم پرداخت (checkout) */}
      {checkout ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">اطلاعات پرداخت</h2>
            <button onClick={() => setCheckout(null)} className="p-1 hover:bg-ink-3 rounded"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-4 rounded-xl2 bg-ink-3 border border-line space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">مبلغ قابل پرداخت</span>
              <span className="font-black text-lime tabular-nums">{checkout.payment.price.toLocaleString("fa-IR")} تومان</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">پلن</span>
              <span>{checkout.payment.planName} — {checkout.payment.months} ماه</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">شمارهٔ پیگیری</span>
              <span className="font-mono text-paper text-xs">{checkout.payment.id}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl2 bg-amber/5 border border-amber/30 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-amber font-semibold mb-2">
              <CreditCard className="w-4 h-4" /> اطلاعات کارت
            </div>
            <div className="flex justify-between" dir="ltr">
              <span className="text-muted">شماره کارت</span>
              <span className="font-mono text-paper">{checkout.bank.cardNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">به نام</span>
              <span>{checkout.bank.cardOwner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">بانک</span>
              <span>{checkout.bank.bankName}</span>
            </div>
            {checkout.bank.sheba && checkout.bank.sheba !== "—" && (
              <div className="flex justify-between" dir="ltr">
                <span className="text-muted">شبا</span>
                <span className="font-mono text-paper text-xs">{checkout.bank.sheba}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl2 bg-ink-3 border border-line text-sm">
            <p className="mb-3">
              ۱. مبلغ <b className="text-lime">{checkout.payment.price.toLocaleString("fa-IR")} تومان</b> را به کارت بالا واریز کن.
            </p>
            <p className="mb-3">
              ۲. <b>شمارهٔ پیگیری</b> (<span className="font-mono text-xs">{checkout.payment.id}</span>) را در توضیحات تراکنش بنویس.
            </p>
            <p>۳. عکس رسید پرداخت را اینجا آپلود کن.</p>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-lime" />
              رسید پرداخت (عکس — JPG/PNG، حداکثر ۲۰ مگابایت)
            </label>
            <input ref={fileRef} type="file" accept="image/*" className="input"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadReceipt(f); }}
              disabled={uploading} />
            {uploading && (
              <p className="text-xs text-lime mt-2 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> در حال آپلود…
              </p>
            )}
            {uploadErr && <p className="text-danger text-sm mt-2">{uploadErr}</p>}
          </div>
        </motion.div>
      ) : (
        <>
          {/* مدت */}
          <section>
            <h2 className="font-bold mb-3">مدت اشتراک</h2>
            <div className="flex gap-2 flex-wrap">
              {durations.map(d => (
                <button key={d.months} onClick={() => setMonths(d.months as 1 | 3 | 6)}
                  className={`chip transition px-4 py-2 ${months === d.months ? "bg-lime text-ink border-lime" : ""}`}>
                  {d.label}
                  {d.discount > 0 && (
                    <span className={`text-[10px] ${months === d.months ? "text-ink/70" : "text-lime"} mr-1`}>
                      {d.discount}٪ تخفیف
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* پلن‌ها */}
          <section className="grid md:grid-cols-3 gap-4">
            {plans.map(p => {
              const c = colorMap[p.color];
              const Icon = iconMap[p.id];
              const price = calcPrice(p, months);
              const isCurrent = active?.plan === p.id;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className={`card ${c.bg} ${c.border} ${p.highlight ? c.glow : ""} relative`}>
                  {p.highlight && (
                    <div className="absolute -top-2.5 right-4 chip bg-lime text-ink border-lime text-[10px] font-bold">
                      پیشنهاد ما
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-xl2 ${c.bg} border ${c.border} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-xs text-muted mt-1">{p.tagline}</p>
                  <div className="my-4">
                    <div className="text-3xl font-black num">{price.toLocaleString("fa-IR")}</div>
                    <div className="text-xs text-muted">تومان / {months} ماه</div>
                  </div>
                  <ul className="space-y-2 text-sm mb-5">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${c.text}`} />
                        <span className="text-paper/90">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => startCheckout(p.id)}
                    disabled={busy !== null || !me?.grade || isCurrent}
                    className={`w-full ${p.highlight ? "btn-primary" : "btn-ghost"}`}>
                    {isCurrent ? "فعال" :
                     busy === p.id ? "…" :
                     !me?.grade ? "اول پروفایل" :
                     active ? "تمدید" : "خرید"}
                  </button>
                </motion.div>
              );
            })}
          </section>
        </>
      )}

      <div className="card text-xs text-muted">
        <b className="text-paper">نحوهٔ پرداخت:</b> کارت‌به‌کارت + آپلود رسید. تیم پشتیبانی ظرف حداکثر ۲۴ ساعت تأیید می‌کند.
        اگر رسید را اشتباه آپلود کردی، از <a href="/app/support" className="text-lime">پشتیبانی</a> تیکت بزن.
      </div>
    </div>
  );
}