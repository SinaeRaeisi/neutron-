"use client";
import { useEffect, useState } from "react";
import { LifeBuoy, MessageSquare, Send, ChevronDown, CheckCheck, Loader2 } from "lucide-react";
import { formatIranDate, formatIranTime } from "@/lib/iran-time";
import type { SupportTicket } from "@/lib/types";

const statusLabel = {
  open:     { text: "باز",           cls: "border-lime/40 text-lime bg-lime/10" },
  answered: { text: "پاسخ داده شد", cls: "border-ok/40 text-ok bg-ok/10" },
  closed:   { text: "بسته",          cls: "border-line text-muted" },
} as const;

const filterTabs = [
  { key: "all",      label: "همه" },
  { key: "open",     label: "باز" },
  { key: "answered", label: "پاسخ داده" },
  { key: "closed",   label: "بسته" },
] as const;

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "answered" | "closed">("all");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/admin/tickets");
      if (r.ok) {
        const d = await r.json();
        setTickets(d.tickets ?? []);
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function sendReply(ticketId: string) {
    const text = replyText[ticketId]?.trim();
    if (!text) return;
    setSending(ticketId);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) { alert("ارسال ناموفق."); return; }
      setReplyText(r => ({ ...r, [ticketId]: "" }));
      await load();
    } finally { setSending(null); }
  }

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div className="space-y-6">
      <header>
        <div className="chip border-violet/30 text-violet bg-violet/5 mb-3">
          <LifeBuoy className="w-3 h-3" /> پشتیبانی
        </div>
        <h1 className="h2">تیکت‌ها</h1>
        <p className="text-muted text-sm mt-1">
          همهٔ تیکت‌های کاربران — پاسخ بده، وضعیت عوض می‌شود.
        </p>
      </header>

      <div className="flex gap-1.5 flex-wrap">
        {filterTabs.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`chip transition ${filter === f.key ? "bg-lime text-ink border-lime" : ""}`}>
            {f.label}
            <span className="text-[10px] opacity-70">
              ({f.key === "all" ? tickets.length : tickets.filter(t => t.status === f.key).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card text-center py-8 text-muted text-sm">
          <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
          در حال بارگذاری…
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <LifeBuoy className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">تیکتی در این دسته نیست.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const st = statusLabel[t.status];
            const isOpen = openId === t.id;
            return (
              <div key={t.id} className="card">
                <button onClick={() => setOpenId(isOpen ? null : t.id)}
                  className="w-full text-right flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-muted mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`chip text-[10px] ${st.cls}`}>{st.text}</span>
                      <span className="chip text-[10px]">{t.category}</span>
                      <span className="text-xs text-muted">{t.userName}</span>
                    </div>
                    <div className="font-semibold text-sm">{t.subject}</div>
                    <div className="text-xs text-muted mt-1">
                      {formatIranDate(t.createdAt)} · {formatIranTime(t.createdAt)} · {t.messages.length.toLocaleString("fa-IR")} پیام
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted transition ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-line space-y-3">
                    {t.messages.map(m => {
                      const isAdmin = m.authorRole === "admin";
                      return (
                        <div key={m.id} className={`flex ${isAdmin ? "flex-row-reverse" : ""}`}>
                          <div className={`max-w-[85%] rounded-xl2 p-3 ${
                            isAdmin ? "bg-lime/10 border border-lime/20" : "bg-ink-3"
                          }`}>
                            <div className="text-xs text-muted mb-1">
                              {m.authorName}
                              {isAdmin && <span className="text-lime mr-1">· پشتیبانی</span>}
                              {" · "}
                              {formatIranTime(m.sentAt)}
                            </div>
                            <p className="text-sm">{m.text}</p>
                          </div>
                        </div>
                      );
                    })}

                    {t.status !== "closed" && (
                      <div className="flex gap-2 pt-2">
                        <input
                          className="input flex-1"
                          placeholder="پاسخ به‌عنوان پشتیبانی…"
                          value={replyText[t.id] ?? ""}
                          onChange={e => setReplyText(r => ({ ...r, [t.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && sendReply(t.id)}
                        />
                        <button
                          onClick={() => sendReply(t.id)}
                          disabled={!replyText[t.id]?.trim() || sending === t.id}
                          className="btn-primary">
                          {sending === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    )}

                    {t.status === "answered" && (
                      <p className="text-xs text-ok flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> پاسخ داده شده — منتظر پاسخ کاربر
                      </p>
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