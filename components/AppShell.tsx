"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Home, BookOpen, Network, BarChart3, User, Search, Bell, LogOut, Sparkles,
  Menu, X, Video, ClipboardList, Newspaper, LifeBuoy, Crown, CalendarDays,
  MessageCircleQuestion, CheckCheck, Inbox,
} from "lucide-react";

const links = [
  { href: "/app",             label: "امروز",          Icon: Home },
  { href: "/app/courses",     label: "دوره‌ها",         Icon: BookOpen },
  { href: "/app/calendar",    label: "تقویم",          Icon: CalendarDays },
  { href: "/app/live",        label: "کلاس زنده",       Icon: Video },
  { href: "/app/mock-exams",  label: "آزمون آزمایشی",   Icon: ClipboardList },
  { href: "/app/subscription",label: "اشتراک من",       Icon: Crown },
  { href: "/app/qanda",       label: "رفع اشکال",       Icon: MessageCircleQuestion },
  { href: "/app/articles",    label: "مقالات",          Icon: Newspaper },
  { href: "/app/graph",       label: "گراف دانش",       Icon: Network },
  { href: "/app/progress",    label: "پیشرفت",          Icon: BarChart3 },
  { href: "/app/support",     label: "پشتیبانی",        Icon: LifeBuoy },
  { href: "/app/profile",     label: "پروفایل",         Icon: User },
];

const mobileLinks = [
  { href: "/app",             label: "امروز",  Icon: Home },
  { href: "/app/courses",     label: "دوره‌ها",Icon: BookOpen },
  { href: "/app/qanda",       label: "پرسش",   Icon: MessageCircleQuestion },
  { href: "/app/live",        label: "زنده",   Icon: Video },
  { href: "/app/profile",     label: "پروفایل",Icon: User },
];

interface Me { name: string; role: string; }
interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "همین الان";
  if (min < 60) return `${min.toLocaleString("fa-IR")} دقیقه پیش`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h.toLocaleString("fa-IR")} ساعت پیش`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d.toLocaleString("fa-IR")} روز پیش`;
  return new Date(iso).toLocaleDateString("fa-IR");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(setMe).catch(() => {});
  }, []);

  async function loadNotifications(showLoading = false) {
    if (showLoading) setNotifLoading(true);
    try {
      const r = await fetch("/api/notifications");
      if (r.ok) {
        const d = await r.json();
        setNotifications(d.notifications ?? []);
        setUnread(d.unread ?? 0);
      }
    } catch { /* noop */ }
    finally { if (showLoading) setNotifLoading(false); }
  }

  useEffect(() => {
    loadNotifications();
    const t = setInterval(() => loadNotifications(), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (notifOpen) loadNotifications(true);
  }, [notifOpen]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [notifOpen]);

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch { loadNotifications(); }
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    } catch { loadNotifications(); }
  }

  function handleNotifClick(n: Notification) {
    if (!n.read) markRead(n.id);
    setNotifOpen(false);
    if (n.href) router.push(n.href);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col bg-ink-2/50 border-l border-line p-4 min-h-dvh sticky top-0 h-dvh">
        <Link href="/app" className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-lime" />
          <div>
            <span className="text-lime font-black tracking-widest text-sm block leading-none">نوترون</span>
            <span className="text-[10px] text-muted">هستهٔ یادگیری</span>
          </div>
        </Link>

        <nav className="flex flex-col gap-0.5 overflow-y-auto flex-1 -mx-1 px-1">
          {links.map(n => {
            const active = path === n.href || (n.href !== "/app" && path.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl2 text-sm transition ${
                  active ? "bg-lime text-ink font-semibold" : "text-muted hover:text-paper hover:bg-ink-3"
                }`}>
                <n.Icon className="w-4 h-4 shrink-0" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-3 mt-3 border-t border-line space-y-2">
          {me && (
            <Link href="/app/profile" className="flex items-center gap-2.5 p-2 rounded-xl2 hover:bg-ink-3 transition">
              <div className="w-8 h-8 rounded-full bg-lime/20 text-lime flex items-center justify-center text-sm font-bold shrink-0">
                {me.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{me.name}</div>
                <div className="text-[10px] text-muted">
                  {me.role === "teacher" ? "معلم" : me.role === "admin" ? "مدیر" : "دانش‌آموز"}
                </div>
              </div>
            </Link>
          )}
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl2 text-sm text-danger hover:bg-danger/10 transition">
            <LogOut className="w-4 h-4" />خروج
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 bg-ink/80 backdrop-blur-xl border-b border-line">
          <div className="h-14 px-4 md:px-6 flex items-center justify-between gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 -m-1.5">
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime" />
              <span className="text-lime font-black tracking-widest text-xs">نوترون</span>
            </div>

            <Link href="/app/search" className="hidden md:flex items-center gap-2 flex-1 max-w-md px-3 py-2 rounded-xl2 bg-ink-3 border border-line text-sm text-muted hover:text-paper transition">
              <Search className="w-4 h-4" />
              <span>جست‌وجوی دوره، درس، مقاله…</span>
              <kbd className="mr-auto text-[10px] bg-ink-4 px-1.5 py-0.5 rounded border border-line/50">⌘K</kbd>
            </Link>

            <div className="flex items-center gap-1">
              {/* Notifications */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2 rounded-xl2 hover:bg-ink-3 text-muted hover:text-paper transition relative"
                  aria-label="اعلان‌ها"
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] rounded-full bg-danger text-paper text-[10px] font-bold flex items-center justify-center px-1">
                      {unread > 9 ? "۹+" : unread.toLocaleString("fa-IR")}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute left-0 mt-2 w-80 md:w-96 max-h-[480px] bg-ink-2 border border-line rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-line">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-lime" />
                        <span className="font-bold text-sm">اعلان‌ها</span>
                        {unread > 0 && (
                          <span className="chip text-[10px] border-danger/40 text-danger bg-danger/10">
                            {unread.toLocaleString("fa-IR")} جدید
                          </span>
                        )}
                      </div>
                      {unread > 0 && (
                        <button onClick={markAllRead}
                          className="text-xs text-lime hover:opacity-80 flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5" /> همه خوانده
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto max-h-[400px]">
                      {notifLoading && notifications.length === 0 ? (
                        <div className="text-center py-8 text-muted text-xs">در حال بارگذاری…</div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-10 px-4">
                          <Inbox className="w-10 h-10 text-muted mx-auto mb-2" />
                          <p className="text-sm text-muted">هنوز اعلانی نداری.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-line">
                          {notifications.map(n => (
                            <button
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              className={`w-full text-right p-3 hover:bg-ink-3 transition flex items-start gap-2.5 ${
                                !n.read ? "bg-lime/5" : ""
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                                !n.read ? "bg-lime" : "bg-transparent"
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm leading-snug ${
                                  !n.read ? "font-bold text-paper" : "text-paper/80"
                                }`}>{n.title}</div>
                                <div className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">{n.body}</div>
                                <div className="text-[10px] text-muted mt-1.5">{timeAgo(n.createdAt)}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {me && (
                <Link href="/app/profile" className="md:hidden w-8 h-8 rounded-full bg-lime/20 text-lime flex items-center justify-center text-xs font-bold ml-1">
                  {me.name[0]}
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-ink-2/95 backdrop-blur-xl border-t border-line z-40">
        <div className="grid grid-cols-5">
          {mobileLinks.map(n => {
            const active = path === n.href || (n.href !== "/app" && path.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] transition ${
                  active ? "text-lime" : "text-muted"
                }`}>
                <n.Icon className="w-5 h-5" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-ink/95 backdrop-blur" onClick={() => setMobileOpen(false)}>
          <div className="bg-ink-2 border-l border-line w-64 h-full p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-lime font-black tracking-widest text-sm">نوترون</span>
              <button onClick={() => setMobileOpen(false)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <nav className="flex flex-col gap-1">
              {links.map(n => (
                <Link key={n.href} href={n.href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl2 text-sm hover:bg-ink-3">
                  <n.Icon className="w-4 h-4" />{n.label}
                </Link>
              ))}
            </nav>
            <button onClick={logout} className="mt-6 w-full flex items-center gap-2 px-3 py-2 rounded-xl2 text-sm text-danger hover:bg-danger/10">
              <LogOut className="w-4 h-4" />خروج
            </button>
          </div>
        </div>
      )}
    </div>
  );
}