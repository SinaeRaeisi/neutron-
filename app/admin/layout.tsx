"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Trophy, LifeBuoy, BookOpen, Users, Sparkles,
  CreditCard, Phone, FileText, GraduationCap,
} from "lucide-react";

const links = [
  { href: "/admin", label: "داشبورد", Icon: LayoutDashboard },
  { href: "/admin/contacts", label: "تماس‌ها", Icon: Phone },
  { href: "/admin/payments", label: "پرداخت‌ها", Icon: CreditCard },
  { href: "/admin/courses", label: "دوره‌ها", Icon: GraduationCap },
  { href: "/admin/articles", label: "مقالات", Icon: FileText },
  { href: "/admin/mock-exams", label: "آزمون‌ها", Icon: Trophy },
  { href: "/admin/tickets", label: "تیکت‌ها", Icon: LifeBuoy },
  { href: "/teacher", label: "پنل معلم", Icon: BookOpen },
  { href: "/app", label: "نمای دانش‌آموز", Icon: Users },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="hidden md:flex md:flex-col bg-ink-2/50 border-l border-line p-4 min-h-dvh sticky top-0 h-dvh">
        <Link href="/admin" className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-lime" />
          <div>
            <span className="text-lime font-black tracking-widest text-sm block leading-none">نوترون</span>
            <span className="text-[10px] text-muted">پنل مدیریت</span>
          </div>
        </Link>
        <nav className="flex flex-col gap-1 overflow-y-auto flex-1">
          {links.map(n => {
            const active = path === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl2 text-sm transition ${
                  active ? "bg-lime text-ink font-semibold" : "text-muted hover:text-paper hover:bg-ink-3"
                }`}>
                <n.Icon className="w-4 h-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="md:hidden border-b border-line bg-ink-2/50 sticky top-0 z-30">
          <div className="p-3 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime" />
              <span className="text-lime font-black tracking-widest text-xs">نوترون</span>
            </Link>
          </div>
          <div className="px-3 pb-2 flex gap-1 overflow-x-auto">
            {links.map(n => {
              const active = path === n.href;
              return (
                <Link key={n.href} href={n.href}
                  className={`px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${
                    active ? "bg-lime text-ink font-semibold" : "text-muted hover:bg-ink-3"
                  }`}>
                  {n.label}
                </Link>
              );
            })}
          </div>
        </header>
        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}