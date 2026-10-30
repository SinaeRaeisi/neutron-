"use client";
import { useEffect, useState } from "react";
import { Phone, Mail, MessageSquare, Loader2, Check } from "lucide-react";
import { formatIranDate, formatIranTime } from "@/lib/iran-time";
import { gradeLabel } from "@/lib/data";
import type { ContactRequest } from "@/lib/types";

const statusLabel = {
  new: { text: "جدید", cls: "border-amber/40 text-amber bg-amber/10" },
  contacted: { text: "تماس گرفته", cls: "border-sky/40 text-sky bg-sky/10" },
  closed: { text: "بسته", cls: "border-line text-muted" },
} as const;

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const r = await fetch("/api/admin/contacts");
      if (r.ok) {
        const d = await r.json();
        setContacts(d.contacts ?? []);
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: "new" | "contacted" | "closed") {
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) await load();
    } catch { /* noop */ }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="chip border-lime/30 text-lime bg-lime/5 mb-3">
          <Phone className="w-3 h-3" /> تماس‌ها
        </div>
        <h1 className="h2">درخواست‌های تماس</h1>
        <p className="text-muted text-sm mt-1">
          کاربران علاقه‌مند به ثبت‌نام — با آن‌ها تماس بگیر.
        </p>
      </header>

      {loading ? (
        <div className="card text-center py-8 text-muted text-sm"><Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />…</div>
      ) : contacts.length === 0 ? (
        <div className="card text-center py-12">
          <Phone className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">هنوز درخواستی نیامده.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => {
            const st = statusLabel[c.status];
            return (
              <div key={c.id} className="card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`chip text-[10px] ${st.cls}`}>{st.text}</span>
                      {c.grade && <span className="chip text-[10px]">پایهٔ {gradeLabel(c.grade)}</span>}
                      {c.major && <span className="chip text-[10px]">{c.major}</span>}
                    </div>
                    <div className="font-bold">{c.name}</div>
                    <div className="flex items-center gap-3 text-xs text-muted mt-1 flex-wrap">
                      <span dir="ltr" className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                      {c.email && <span dir="ltr" className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                    </div>
                    {c.message && (
                      <p className="text-xs text-muted mt-2 p-2 rounded bg-ink-3/50 flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {c.message}
                      </p>
                    )}
                    <div className="text-[10px] text-muted mt-2">
                      {formatIranDate(c.createdAt)} · {formatIranTime(c.createdAt)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {c.status !== "contacted" && (
                      <button onClick={() => setStatus(c.id, "contacted")} className="btn-ghost btn-sm">
                        <Check className="w-3.5 h-3.5" /> تماس گرفتم
                      </button>
                    )}
                    {c.status !== "closed" && (
                      <button onClick={() => setStatus(c.id, "closed")} className="btn-ghost btn-sm text-muted">
                        بستن
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}