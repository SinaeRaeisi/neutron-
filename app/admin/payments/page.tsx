"use client";
import { useEffect, useState } from "react";
import { CreditCard, Check, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { planName, type PlanId } from "@/lib/plans";
import type { PendingPayment } from "@/lib/types";
import { formatIranDate, formatIranTime } from "@/lib/iran-time";

const statusLabel = {
  pending_receipt: { text: "در انتظار رسید", cls: "border-line text-muted" },
  pending_review:  { text: "در انتظار تأیید", cls: "border-amber/40 text-amber bg-amber/10" },
  approved:        { text: "تأیید شده", cls: "border-ok/40 text-ok bg-ok/10" },
  rejected:        { text: "رد شده", cls: "border-danger/40 text-danger bg-danger/10" },
} as const;

const filterTabs = [
  { key: "pending_review", label: "در انتظار" },
  { key: "approved", label: "تأیید شده" },
  { key: "rejected", label: "رد شده" },
  { key: "all", label: "همه" },
] as const;

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending_review" | "approved" | "rejected">("pending_review");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/admin/payments");
      if (r.ok) {
        const d = await r.json();
        setPayments(d.payments ?? []);
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    if (!confirm("پرداخت تأیید شود و اشتراک فعال گردد؟")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}/approve`, { method: "POST" });
      if (res.ok) await load();
      else alert("تأیید ناموفق.");
    } finally { setBusy(null); }
  }

  async function reject(id: string) {
    const note = prompt("دلیل رد (اختیاری):") ?? "";
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (res.ok) await load();
      else alert("رد ناموفق.");
    } finally { setBusy(null); }
  }

  const filtered = filter === "all" ? payments : payments.filter(p => p.status === filter);
  const pendingCount = payments.filter(p => p.status === "pending_review").length;

  return (
    <div className="space-y-6">
      <header>
        <div className="chip border-amber/30 text-amber bg-amber/5 mb-3">
          <CreditCard className="w-3 h-3" /> پرداخت‌ها
        </div>
        <h1 className="h2">پرداخت‌های کارت‌به‌کارت</h1>
        <p className="text-muted text-sm mt-1">
          رسیدهای آپلودشده را بررسی و تأیید کن.
          {pendingCount > 0 && <span className="text-amber font-semibold"> · {pendingCount} در انتظار</span>}
        </p>
      </header>

      <div className="flex gap-1.5 flex-wrap">
        {filterTabs.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`chip transition ${filter === f.key ? "bg-lime text-ink border-lime" : ""}`}>
            {f.label}
            <span className="text-[10px] opacity-70">
              ({f.key === "all" ? payments.length : payments.filter(p => p.status === f.key).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card text-center py-8 text-muted text-sm">در حال بارگذاری…</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">پرداختی در این دسته نیست.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const st = statusLabel[p.status];
            return (
              <div key={p.id} className="card">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`chip text-[10px] ${st.cls}`}>{st.text}</span>
                      <span className="chip text-[10px]">{planName[p.plan as PlanId]} · {p.months} ماه</span>
                    </div>
                    <div className="font-bold text-sm">{p.userName}</div>
                    <div className="text-xs text-muted mt-0.5" dir="ltr">{p.userPhone ?? "—"}</div>
                    <div className="text-xs text-muted mt-1">
                      {formatIranDate(p.createdAt)} · {formatIranTime(p.createdAt)}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-muted">مبلغ</div>
                    <div className="text-lg font-black text-lime tabular-nums">{p.price.toLocaleString("fa-IR")}</div>
                    <div className="text-[10px] text-muted">شمارهٔ پیگیری: <span className="font-mono">{p.id}</span></div>
                  </div>
                </div>

                {p.receiptUrl && (
                  <div className="mb-3">
                    <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 p-2 rounded-lg bg-ink-3 border border-line hover:border-lime/40 text-xs">
                      <ImageIcon className="w-4 h-4 text-lime" />
                      مشاهدهٔ رسید: {p.receiptName ?? "رسید"}
                    </a>
                  </div>
                )}

                {p.status === "pending_review" && (
                  <div className="flex gap-2">
                    <button onClick={() => approve(p.id)} disabled={busy === p.id} className="btn-primary btn-sm flex-1">
                      {busy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      تأیید و فعال‌سازی
                    </button>
                    <button onClick={() => reject(p.id)} disabled={busy === p.id} className="btn-ghost btn-sm text-danger">
                      <X className="w-3.5 h-3.5" /> رد
                    </button>
                  </div>
                )}

                {p.reviewNote && (
                  <div className="mt-2 text-xs text-muted">
                    <b className="text-paper">یادداشت: </b>{p.reviewNote}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}