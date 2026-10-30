import Link from "next/link";

const links = [
  { href: "/teacher",           label: "نمای کلی" },
  { href: "/teacher/questions", label: "بانک سؤال" },
  { href: "/teacher/quizzes",   label: "ساخت آزمون" },
  { href: "/teacher/live",      label: "کلاس زنده" },
  { href: "/teacher/qanda",     label: "رفع اشکال" },
  { href: "/teacher/analytics", label: "تحلیل" },
];

export default function TeacherShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden md:flex md:flex-col bg-ink-2/50 border-l border-line p-4 min-h-dvh">
        <Link href="/teacher" className="block mb-6">
          <span className="text-lime font-black tracking-widest">نوترون</span>
          <span className="block text-[11px] text-muted">پنل معلم</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {links.map(n => (
            <Link key={n.href} href={n.href}
              className="px-3 py-2 rounded-xl2 text-sm hover:bg-ink-3">{n.label}</Link>
          ))}
          <Link href="/app"
            className="mt-6 px-3 py-2 rounded-xl2 text-xs text-muted hover:bg-ink-3">
            → نمای دانش‌آموز
          </Link>
        </nav>
      </aside>
      <main className="p-4 md:p-8 max-w-5xl w-full mx-auto pb-24 md:pb-8">
        <nav className="md:hidden flex gap-1 overflow-x-auto mb-4">
          {links.map(n => (
            <Link key={n.href} href={n.href}
              className="chip whitespace-nowrap">{n.label}</Link>
          ))}
        </nav>
        {children}
      </main>
    </div>
  );
}