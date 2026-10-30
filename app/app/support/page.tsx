"use client";
import { useEffect, useState } from "react";
import { LifeBuoy, Plus, MessageSquare, Send, X, ChevronDown, Loader2 } from "lucide-react";
import type { SupportTicket, TicketCategory } from "@/lib/types";

const statusLabel = {
  open:     { text: "باز", color: "border-lime/40 text-lime bg-lime/10" },
  answered: { text: "پاسخ داده شد", color: "border-ok/40 text-ok bg-ok/10" },
  closed:   { text: "بسته", color: "border-line text-muted" },
} as const;

const categories: TicketCategory[] = ["پرداخت", "فنی", "آموزشی", "پیشنهاد", "سایر"];

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "فنی" as TicketCategory, text: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/tickets");
      if (r.ok) {
        const d = await r.json();
        setTickets(d.tickets ?? []);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.text.trim()) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setErr(e.error ?? "ارسال ناموفق.");
        return;
      }
      setForm({ subject: "", category: "فنی", text: "" });
      setCreating(false);
      await load();
    } finally { setBusy(false); }
  }

  async function sendReply(ticketId: string, text: string) {
    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) { alert("ارسال ناموفق."); return; }
    await load();
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="chip border-violet/30 text-violet bg-violet/5 mb-3">
            <LifeBuoy className="w-3 h-3" /> پشتیبانی
          </div>
          <h1 className="h2">پشتیبانی</h1>
          <p className="text-muted text-sm mt-1">
            سؤال، مشکل، یا پیشنهاد — همه‌چیز را یک‌جا بپرس.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> تیکت جدید
        </button>
      </header>

      {creating && (
        <form onSubmit={submitNew} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">تیکت جدید</h2>
            <button type="button" onClick={() => setCreating(false)} className="p-1 hover:bg-ink-3 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="label">موضوع</label>
            <input className="input" value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
          <div>
            <label className="label">دسته</label>
            <select className="input" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as TicketCategory }))}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">توضیحات</label>
            <textarea className="input min-h-[100px] resize-none" value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value }))} />
          </div>
          {err && <p className="text-danger text-sm">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> …</> : "ارسال"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="card text-center py-8 text-muted text-sm">در حال بارگذاری…</div>
      ) : tickets.length === 0 ? (
        <div className="card text-center py-12">
          <LifeBuoy className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">هنوز تیکتی نداری. اگر سؤالی داری، تیکت بزن.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => {
            const st = statusLabel[t.status];
            const isOpen = openId === t.id;
            return (
              <div key={t.id} className="card">
                <button
                  onClick={() => setOpenId(isOpen ? null : t.id)}
                  className="w-full text-right flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-muted mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`chip text-[10px] ${st.color}`}>{st.text}</span>
                      <span className="chip text-[10px]">{t.category}</span>
                    </div>
                    <div className="font-semibold text-sm">{t.subject}</div>
                    <div className="text-xs text-muted mt-1">
                      {new Date(t.createdAt).toLocaleDateString("fa-IR")} · {t.messages.length} پیام
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted transition ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-line space-y-3">
                    {t.messages.map(m => {
                      const isMe = m.authorRole === "student";
                      return (
                        <div key={m.id} className={`flex ${isMe ? "" : "flex-row-reverse"}`}>
                          <div className={`max-w-[85%] rounded-xl2 p-3 ${
                            isMe ? "bg-ink-3" : "bg-lime/10 border border-lime/20"
                          }`}>
                            <div className="text-xs text-muted mb-1">
                              {m.authorName} · {new Date(m.sentAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <p className="text-sm">{m.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    {t.status !== "closed" && (
                      <ReplyBox onSend={text => sendReply(t.id, text)} />
                    )}
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

function ReplyBox({ onSend }: { onSend: (t: string) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try { await onSend(text); setText(""); } finally { setBusy(false); }
  }
  return (
    <div className="flex gap-2">
      <input className="input flex-1" placeholder="پاسخ خود را بنویس…" value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && send()} />
      <button onClick={send} disabled={!text.trim() || busy} className="btn-primary">
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}