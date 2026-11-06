"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Sparkles, ArrowLeft, Menu, X, Network, Target, Zap,
  TrendingUp, Shield, Play, Star, Clock, Search,
  GraduationCap, BookOpen, Mail, Phone, MapPin, FileText,
} from "lucide-react";
import { courses, users, articles, GRADES, MAJORS, gradeLabel, getTeacher } from "@/lib/data";
import { TestimonialsSection } from "@/components/TestimonialsSection";

/* ═══════════════════ Header ═══════════════════ */
const NAV = [
  { href: "#courses", label: "دوره‌ها" },
  { href: "#articles", label: "مقالات" },
  { href: "#why", label: "چرا نوترون" },
  { href: "#contact", label: "تماس با ما" },
];

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-ink/85 backdrop-blur-xl border-b border-line/60" : ""
    }`}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-lime" />
          </div>
          <span className="text-lime font-black tracking-[0.15em] text-sm">نوترون</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(l => (
            <a key={l.href} href={l.href} className="px-3.5 py-2 text-sm text-muted hover:text-paper transition">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="text-sm text-muted hover:text-paper px-3 py-2">ورود</Link>
          <Link href="/login" className="btn-primary btn-sm">ثبت‌نام</Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 -m-2">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-ink-2 border-t border-line">
            <div className="px-4 py-3 space-y-1">
              {NAV.map(l => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm hover:bg-ink-3">{l.label}</a>
              ))}
              <div className="pt-3 border-t border-line flex gap-2">
                <Link href="/login" className="btn-ghost btn-sm flex-1">ورود</Link>
                <Link href="/login" className="btn-primary btn-sm flex-1">ثبت‌نام</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ═══════════════════ Hero + Course Finder ═══════════════════ */
function Hero() {
  const [grade, setGrade] = useState<number>(10);
  const [major, setMajor] = useState<string>("تجربی");
  const [subject, setSubject] = useState<string>("");

  const subjects = ["ریاضی", "فیزیک", "شیمی", "زیست", "ادبیات", "عربی", "زبان"];

  return (
    <section className="relative pt-24 md:pt-32 pb-16 md:pb-20 overflow-hidden bg-mesh">
      <div className="absolute inset-0 surface-grid opacity-[0.06]" />

      <div className="relative max-w-5xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center mb-10">
          <div className="inline-flex items-center gap-2 chip border-lime/30 text-lime bg-lime/5 mb-5">
            <Sparkles className="w-3 h-3" />
            یادگیری شخصی‌سازی‌شده، مبتنی بر گراف دانش
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            مسیر یادگیری‌ات را از نو بساز.
          </h1>
          <p className="text-base md:text-lg text-muted max-w-xl mx-auto leading-relaxed">
            نوترون دقیقاً می‌داند کجای یادگیری مشکل داری و چه چیزی باید بخوانی.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="card p-5 md:p-6 max-w-3xl mx-auto bg-ink-2/95 backdrop-blur border-line/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label text-xs">پایه</label>
              <select value={grade} onChange={e => setGrade(+e.target.value)} className="input text-sm">
                {GRADES.map(g => <option key={g} value={g}>{gradeLabel(g)}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">رشته</label>
              <select value={major} onChange={e => setMajor(e.target.value)} className="input text-sm">
                {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">درس (اختیاری)</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="input text-sm">
                <option value="">همهٔ دروس</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <Link href="/login" className="btn-primary w-full mt-4">
            <Search className="w-4 h-4" />
            جست‌وجوی دوره‌های مناسب
          </Link>
        </motion.div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted mt-6 flex-wrap">
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-lime" />برای پایه ۶ تا ۱۲</div>
          <span>·</span>
          <div>همهٔ رشته‌ها</div>
          <span>·</span>
          <div>{users.filter(u => u.role === "teacher").length} مدرس متخصص</div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════ Stats ═══════════════════ */
function Counter({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const dur = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return <span ref={ref} className="tabular-nums">{n.toLocaleString("fa-IR")}{suffix}</span>;
}

function Stats() {
  const teacherCount = users.filter(u => u.role === "teacher").length;
  const studentCount = users.filter(u => u.role === "student").length;
  const data = [
    { v: courses.length, s: "", l: "دوره" },
    { v: 42, s: "", l: "پایه و رشته" },
    { v: teacherCount, s: "", l: "مدرس" },
    { v: studentCount, s: "", l: "دانش‌آموز" },
  ];
  return (
    <section className="border-y border-line/60 bg-ink-2/40">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 grid grid-cols-4 gap-4">
        {data.map((s, i) => (
          <motion.div key={s.l}
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="text-center">
            <div className="text-2xl md:text-3xl font-black text-lime">
              <Counter to={s.v} suffix={s.s} />
            </div>
            <div className="text-xs text-muted mt-1">{s.l}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════ Featured Courses ═══════════════════ */
const coverClass = {
  lime:   "from-lime/20 to-lime/5 border-lime/20",
  sky:    "from-sky/20 to-sky/5 border-sky/20",
  violet: "from-violet/20 to-violet/5 border-violet/20",
  amber:  "from-amber/20 to-amber/5 border-amber/20",
  rose:   "from-rose/20 to-rose/5 border-rose/20",
} as const;

function FeaturedCourses() {
  const featured = courses; // چون دیتابیس خالی است، همان آرایه را بده
if (featured.length === 0) {
  return (
    <section id="courses" className="py-24 text-center border-y border-line/60">
      <h2 className="text-2xl font-bold">هنوز دوره‌ای ثبت نشده است.</h2>
      <p className="text-muted mt-2">به‌زودی دوره‌های جدید اضافه می‌شوند.</p>
    </section>
  );
}
  return (
    <section id="courses" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <div className="text-xs text-lime font-bold tracking-widest mb-2">دوره‌های محبوب</div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">از اینجا شروع کن</h2>
          </div>
          <Link href="/login" className="text-sm text-lime hover:opacity-80 inline-flex items-center gap-1">
            همهٔ دوره‌ها <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map(c => {
            const t = getTeacher(c.teacherId);
            return (
              <Link key={c.id} href="/login" className="card card-hover block group">
                <div className={`aspect-[16/9] rounded-xl2 mb-3 bg-gradient-to-br ${coverClass[c.cover]} border flex items-center justify-center relative overflow-hidden`}>
                  <Play className="w-8 h-8 text-paper/40 group-hover:text-paper/80 transition" />
                  <span className="absolute top-2 right-2 chip text-[10px] bg-ink/70 backdrop-blur">
                    {gradeLabel(c.grade)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted mb-1.5">
                  <span className="chip text-[10px]">{c.subject}</span>
                  <Clock className="w-3 h-3" />
                  <span>{c.lessons.length} جلسه</span>
                </div>
                <h3 className="font-bold text-base group-hover:text-lime transition leading-snug line-clamp-1">
                  {c.title}
                </h3>
                <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">{c.summary}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/60 text-xs text-muted">
                  <span>{t?.name}</span>
                  <span className="chip text-[10px]">{c.level}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════ Why ═══════════════════ */
const FEATURES = [
  { Icon: Network, title: "گراف دانش", desc: "هر مفهوم به پیش‌نیازش وصل است. می‌دانی قبل از این درس، چه باید بلد باشی." },
  { Icon: Target, title: "تشخیص شکاف", desc: "بعد از هر آزمون، نقشهٔ نقطه‌ضعف‌ها را می‌بینی، نه فقط نمره." },
  { Icon: Zap, title: "مسیر شخصی", desc: "مسیر یادگیری از روی عملکرد واقعی تو ساخته می‌شود." },
];

function Why() {
  return (
    <section id="why" className="py-16 md:py-24 bg-ink-2/30 border-y border-line/60">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <div className="text-xs text-lime font-bold tracking-widest mb-2">چرا نوترون</div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">نه فقط ویدیو، یادگیری واقعی</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="card">
              <div className="w-10 h-10 rounded-xl2 bg-lime/10 border border-lime/20 flex items-center justify-center mb-3">
                <f.Icon className="w-5 h-5 text-lime" />
              </div>
              <h3 className="font-bold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════ Articles ═══════════════════ */
function Articles() {
  const featured = articles;
  if (featured.length === 0) return null; // اگر مقاله‌ای نیست، کلاً نمایش نده
  return (
    <section id="articles" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <div className="text-xs text-sky font-bold tracking-widest mb-2">مجله</div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">مقالات و راهنماها</h2>
          </div>
          <Link href="/articles" className="text-sm text-lime hover:opacity-80 inline-flex items-center gap-1">
            همهٔ مقالات <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {featured.map(a => (
            <Link key={a.id} href={`/articles/${a.slug}`} className="card card-hover group">
              <div className={`aspect-[16/9] rounded-xl2 mb-3 bg-gradient-to-br ${coverClass[a.cover]} border flex items-center justify-center relative overflow-hidden`}>
                <FileText className="w-8 h-8 text-paper/40 group-hover:text-paper/80 transition" />
                <span className="absolute top-2 right-2 chip text-[10px] bg-ink/70 backdrop-blur">{a.category}</span>
              </div>
              <h3 className="font-bold text-base group-hover:text-lime transition leading-snug line-clamp-2">
                {a.title}
              </h3>
              <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">{a.excerpt}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/60 text-xs text-muted">
                <span>{getTeacher(a.authorId)?.name}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.readMinutes} دقیقه</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════ Contact ═══════════════════ */
function Contact() {
  return (
    <section id="contact" className="py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="relative card p-8 md:p-14 overflow-hidden bg-gradient-to-br from-ink-2 to-ink-3 border-lime/20 rounded-xl3">
          <div className="absolute inset-0 bg-mesh opacity-60" />
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-lime/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-violet/10 blur-3xl" />

          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
                سؤالی داری؟ <span className="text-lime">با ما حرف بزن.</span>
              </h2>
              <p className="text-muted text-sm leading-relaxed mb-6">
                فرم تماس را پر کن، تیم نوترون ظرف ۲۴ ساعت با تو تماس می‌گیرد.
              </p>
              <Link href="/contact" className="btn-primary inline-flex">
                درخواست تماس با ما <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl2 bg-ink-3/60 border border-line/60">
                <Phone className="w-4 h-4 text-lime shrink-0" />
                <div>
                  <div className="text-xs text-muted">تلفن پشتیبانی</div>
                  <div dir="ltr" className="font-mono text-paper">09965672667</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl2 bg-ink-3/60 border border-line/60">
                <Mail className="w-4 h-4 text-lime shrink-0" />
                <div>
                  <div className="text-xs text-muted">ایمیل</div>
                  <div dir="ltr" className="font-mono text-paper text-xs">@Neutron_ir (Telegram)</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl2 bg-ink-3/60 border border-line/60">
                <MapPin className="w-4 h-4 text-lime shrink-0" />
                <div>
                  <div className="text-xs text-muted">دفتر</div>
                  <div className="text-paper">تهران</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════ Footer ═══════════════════ */
function Footer() {
  return (
    <footer className="border-t border-line/60 bg-ink-2/40">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-lime" />
              </div>
              <span className="text-lime font-black tracking-[0.15em] text-sm">نوترون</span>
            </Link>
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              هستهٔ یادگیری. پلتفرمی که مسیر یادگیری را از روی داده می‌سازد.
            </p>
            <div className="flex gap-3 mt-4 text-sm text-muted flex-wrap">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /><span dir="ltr">09965672667</span></span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />@Neutron_ir (Telegram)</span>
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm mb-3 text-paper">محصول</div>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="#courses" className="hover:text-lime">دوره‌ها</a></li>
              <li><a href="#articles" className="hover:text-lime">مقالات</a></li>
              <li><a href="#why" className="hover:text-lime">ویژگی‌ها</a></li>
              <li><Link href="/contact" className="hover:text-lime">تماس با ما</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-sm mb-3 text-paper">حساب</div>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/login" className="hover:text-lime">ورود</Link></li>
              <li><Link href="/login" className="hover:text-lime">ثبت‌نام</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-5 border-t border-line/60 text-xs text-muted flex justify-between flex-wrap gap-2">
          <span>© ۱۴۰۵ نوترون — ساخته‌شده با ❤ برای دانش‌آموزان ایران</span>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════ Page ═══════════════════ */
export default function Landing() {
  return (
    <div className="min-h-dvh bg-ink text-paper overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <Stats />
        <FeaturedCourses />
        <Why />
        <Articles />
        <TestimonialsSection />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}