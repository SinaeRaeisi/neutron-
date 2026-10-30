import type {
  User, Concept, Course, Quiz, Review, Lesson,
  LiveClass, Article, MockExam, SupportTicket,
} from "./types";

// ──────────────────────────────────────────────────────────
// کاربران
// ──────────────────────────────────────────────────────────
export const users: User[] = [
  { id: "u1", name: "سارا محمدی", role: "student", phone: "09120000001",
    email: "sara@example.com", avatarColor: "lime", grade: 10, major: "ریاضی" },
  { id: "u2", name: "آرش کریمی", role: "teacher", phone: "09120000002",
    email: "arash@example.com", avatarColor: "sky",
    bio: "دبیر ریاضی، ۱۲ سال سابقه، رتبهٔ ۲ کنکور ریاضی. عاشق ساده‌سازی مفاهیم پیچیده." },
  { id: "u3", name: "مدیر سیستم", role: "admin", phone: "09120000003",
    email: "sinaeraeisi@gmail.com", avatarColor: "amber" },
  { id: "u4", name: "نیلوفر احمدی", role: "student", phone: "09120000004",
    email: "niloofar@example.com", avatarColor: "violet", grade: 12, major: "تجربی" },
  { id: "u5", name: "مهسا رضایی", role: "teacher", phone: "09120000005",
    email: "mahsa@example.com", avatarColor: "violet",
    bio: "فیزیک، دانشگاه شریف. تمرکز روی شهود و آزمایش‌های ذهنی." },
  { id: "u6", name: "سینا تهرانی", role: "teacher", phone: "09120000006",
    email: "sina.t@example.com", avatarColor: "amber",
    bio: "شیمی، مولف ۳ کتاب کمک‌درسی. روش «اول واکنش، بعد فرمول»." },
  { id: "u7", name: "نگار موسوی", role: "teacher", phone: "09120000007",
    email: "negar@example.com", avatarColor: "rose",
    bio: "زیست‌شناسی، ۱۰ سال سابقه در مدارس تیزهوشان." },
  { id: "u8", name: "مریم صادقی", role: "teacher", phone: "09120000008",
    email: "maryam@example.com", avatarColor: "sky",
    bio: "ادبیات فارسی، دکتری زبان و ادبیات. عاشق حافظ و شاملو." },
  { id: "u9", name: "حسین رحیمی", role: "teacher", phone: "09120000009",
    email: "hossein@example.com", avatarColor: "lime",
    bio: "عربی، ۱۵ سال تدریس کنکور. صرف و نحو بدون حفظ کردن." },
  { id: "u10", name: "نگین فرهادی", role: "teacher", phone: "09120000010",
    email: "negin@example.com", avatarColor: "violet",
    bio: "زبان انگلیسی، IELTS 8.5. مکالمه قبل از گرامر." },
  { id: "u11", name: "محمد امینی", role: "teacher", phone: "09120000011",
    email: "mohammad@example.com", avatarColor: "amber",
    bio: "دین و زندگی، ۱۲ سال سابقه. مفاهیم به زبان نوجوان." },
];

// ──────────────────────────────────────────────────────────
// مفاهیم
// ──────────────────────────────────────────────────────────
export const concepts: Concept[] = [
  { id: "c1", title: "معادلهٔ درجه دو", subject: "ریاضی", grade: 10, major: "ریاضی", requires: [], x: 80,  y: 60 },
  { id: "c2", title: "دلتا و ریشه‌ها",  subject: "ریاضی", grade: 10, major: "ریاضی", requires: ["c1"], x: 220, y: 40 },
  { id: "c3", title: "تابع درجه دو",    subject: "ریاضی", grade: 10, major: "ریاضی", requires: ["c1"], x: 220, y: 120 },
  { id: "c4", title: "بیشینه و کمینه",  subject: "ریاضی", grade: 11, major: "ریاضی", requires: ["c2", "c3"], x: 360, y: 80 },
  { id: "c5", title: "تابع خطی",        subject: "ریاضی", grade: 9,  major: "عمومی", requires: [], x: 80,  y: 160 },
  { id: "c6", title: "مشتق",            subject: "ریاضی", grade: 12, major: "ریاضی", requires: ["c4"], x: 500, y: 120 },
  { id: "c7", title: "قانون دوم نیوتن", subject: "فیزیک", grade: 10, major: "تجربی", requires: [], x: 80,  y: 60 },
  { id: "c8", title: "کار و انرژی",     subject: "فیزیک", grade: 11, major: "تجربی", requires: ["c7"], x: 240, y: 80 },
  { id: "c9", title: "ساختار اتم",      subject: "شیمی",  grade: 10, major: "تجربی", requires: [], x: 80,  y: 60 },
  { id: "c10", title: "پیوند شیمیایی",  subject: "شیمی",  grade: 10, major: "تجربی", requires: ["c9"], x: 240, y: 60 },
  { id: "c11", title: "سلول",           subject: "زیست",  grade: 10, major: "تجربی", requires: [], x: 80,  y: 60 },
  { id: "c12", title: "ژنتیک",          subject: "زیست",  grade: 12, major: "تجربی", requires: ["c11"], x: 240, y: 80 },
  { id: "c13", title: "آرایه‌های ادبی",  subject: "ادبیات", grade: 10, major: "عمومی", requires: [], x: 80, y: 60 },
  { id: "c14", title: "قواعد فعل",       subject: "عربی",  grade: 10, major: "عمومی", requires: [], x: 80,  y: 60 },
  { id: "c15", title: "زمان‌های انگلیسی", subject: "زبان",  grade: 10, major: "عمومی", requires: [], x: 80,  y: 60 },
];

// ──────────────────────────────────────────────────────────
// کمک‌ساز جلسات
// ──────────────────────────────────────────────────────────
const mkLessons = (
  prefix: string,
  count: number,
  types: ("video" | "article" | "quiz" | "exercise")[],
): Lesson[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}l${i + 1}`,
    title: `جلسهٔ ${i + 1}: ${["مقدمه", "مفهوم اصلی", "تمرین هدایت‌شده", "کاربرد", "مرور و جمع‌بندی"][i % 5]}`,
    type: types[i % types.length],
    durationMin: [8, 12, 15, 10, 18][i % 5],
    free: i < 2,
  }));

// ──────────────────────────────────────────────────────────
// دوره‌ها — پایه ۶ تا ۱۲
// ──────────────────────────────────────────────────────────
export const courses: Course[] = [
  { id: "co1", title: "ریاضی ششم", subject: "ریاضی", grade: 6, major: "عمومی",
    teacherId: "u2", availableTeachers: ["u2", "u5"],
    conceptIds: ["c5"], lessons: mkLessons("co1", 20, ["video", "video", "exercise", "quiz"]),
    summary: "کسر، اعشار، هندسه و حل مسئله — با تمرین‌های تصویری.",
    level: "پایه", cover: "lime", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co2", title: "علوم ششم", subject: "علوم", grade: 6, major: "عمومی",
    teacherId: "u5", availableTeachers: ["u5", "u7"],
    conceptIds: [], lessons: mkLessons("co2", 16, ["video", "article", "exercise"]),
    summary: "از زمین تا بدن — کشف دنیای اطراف با آزمایش‌های ساده.",
    level: "پایه", cover: "sky", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co3", title: "ریاضی هفتم", subject: "ریاضی", grade: 7, major: "عمومی",
    teacherId: "u2", conceptIds: [], lessons: mkLessons("co3", 18, ["video", "exercise", "video", "quiz"]),
    summary: "اعداد صحیح، جبر مقدماتی، هندسه و آمار.",
    level: "پایه", cover: "lime", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co4", title: "ریاضی هشتم", subject: "ریاضی", grade: 8, major: "عمومی",
    teacherId: "u2", conceptIds: [], lessons: mkLessons("co4", 18, ["video", "video", "exercise"]),
    summary: "توان، جذر، معادله، هندسه و احتمال.",
    level: "پایه", cover: "lime", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co5", title: "ریاضی نهم", subject: "ریاضی", grade: 9, major: "عمومی",
    teacherId: "u2", availableTeachers: ["u2", "u5"],
    conceptIds: ["c5"], lessons: mkLessons("co5", 20, ["video", "exercise", "video", "quiz"]),
    summary: "اتحادها، عبارت جبری، تابع، و آماده‌سازی برای پایهٔ دهم.",
    level: "متوسط", cover: "lime", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co6", title: "ریاضی ۱ دهم — ریاضی", subject: "ریاضی", grade: 10, major: "ریاضی",
    teacherId: "u2", availableTeachers: ["u2", "u5"],
    conceptIds: ["c1", "c2", "c3"], lessons: mkLessons("co6", 22, ["video", "video", "exercise", "quiz"]),
    summary: "مجموعه، مثلثات، و تابع درجه دو — پایهٔ همه‌چیز.",
    level: "پایه", cover: "sky", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co7", title: "فیزیک ۱ دهم — ریاضی", subject: "فیزیک", grade: 10, major: "ریاضی",
    teacherId: "u5", conceptIds: ["c7"], lessons: mkLessons("co7", 18, ["video", "exercise", "video", "quiz"]),
    summary: "اندازه‌گیری، حرکت، و قوانین نیوتن با شهود و آزمایش.",
    level: "پایه", cover: "violet", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co8", title: "ریاضی دهم — تجربی", subject: "ریاضی", grade: 10, major: "تجربی",
    teacherId: "u2", availableTeachers: ["u2", "u5"],
    conceptIds: ["c1", "c3"], lessons: mkLessons("co8", 20, ["video", "exercise", "video", "quiz"]),
    summary: "ریاضی با چاشنی کاربرد زیستی — همان مسیر، کمتر انتزاع.",
    level: "پایه", cover: "lime", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co9", title: "زیست ۱ دهم — تجربی", subject: "زیست", grade: 10, major: "تجربی",
    teacherId: "u7", conceptIds: ["c11"], lessons: mkLessons("co9", 16, ["video", "video", "article", "quiz"]),
    summary: "از مولکول تا سلول — پایهٔ همه‌چیز در زیست.",
    level: "پایه", cover: "rose", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co10", title: "شیمی ۱ دهم — تجربی", subject: "شیمی", grade: 10, major: "تجربی",
    teacherId: "u6", conceptIds: ["c9", "c10"], lessons: mkLessons("co10", 16, ["video", "article", "exercise"]),
    summary: "اتم، پیوند، و واکنش — با استعاره‌های روزمره.",
    level: "پایه", cover: "amber", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co11", title: "فیزیک ۲ یازدهم — تجربی", subject: "فیزیک", grade: 11, major: "تجربی",
    teacherId: "u5", conceptIds: ["c8"], lessons: mkLessons("co11", 18, ["video", "exercise", "video", "quiz"]),
    summary: "الکتریسیته، مغناطیس و مدار — با آزمایش‌های ذهنی.",
    level: "متوسط", cover: "violet", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co12", title: "زیست ۲ یازدهم — تجربی", subject: "زیست", grade: 11, major: "تجربی",
    teacherId: "u7", conceptIds: [], lessons: mkLessons("co12", 18, ["video", "article", "quiz"]),
    summary: "تنظیم عصبی، هورمونی و ایمنی — نقشهٔ بدن.",
    level: "متوسط", cover: "rose", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co13", title: "ریاضی ۳ دوازدهم — ریاضی", subject: "ریاضی", grade: 12, major: "ریاضی",
    teacherId: "u2", conceptIds: ["c4", "c6"], lessons: mkLessons("co13", 22, ["video", "exercise", "video", "quiz"]),
    summary: "مشتق، انتگرال و کاربردها — سخت‌ترین و مهم‌ترین بخش کنکور.",
    level: "پیشرفته", cover: "sky", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co14", title: "زیست ۳ دوازدهم — تجربی", subject: "زیست", grade: 12, major: "تجربی",
    teacherId: "u7", conceptIds: ["c12"], lessons: mkLessons("co14", 20, ["video", "video", "exercise", "quiz"]),
    summary: "ژنتیک، تکامل و رفتار — فصل‌های پرسؤال کنکور.",
    level: "پیشرفته", cover: "rose", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co15", title: "ادبیات فارسی دهم", subject: "ادبیات", grade: 10, major: "عمومی",
    teacherId: "u8", conceptIds: ["c13"], lessons: mkLessons("co15", 16, ["video", "article", "quiz"]),
    summary: "متن، آرایه، و دستور — عاشق ادبیات شو.",
    level: "پایه", cover: "violet", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co16", title: "عربی دهم", subject: "عربی", grade: 10, major: "عمومی",
    teacherId: "u9", conceptIds: ["c14"], lessons: mkLessons("co16", 14, ["video", "exercise", "video"]),
    summary: "قواعد و ترجمه — بدون حفظ کردن.",
    level: "پایه", cover: "lime", rating: 0, ratingsCount: 0, students: 0 },

  { id: "co17", title: "زبان انگلیسی دهم", subject: "زبان", grade: 10, major: "عمومی",
    teacherId: "u10", conceptIds: ["c15"], lessons: mkLessons("co17", 15, ["video", "exercise", "video", "quiz"]),
    summary: "مکالمه قبل از گرامر — زبان را زندگی کن.",
    level: "پایه", cover: "sky", rating: 0, ratingsCount: 0, students: 0 },
];

// ──────────────────────────────────────────────────────────
// آزمون‌های کوتاه
// ──────────────────────────────────────────────────────────
export const quizzes: Quiz[] = [
  { id: "q1", courseId: "co6", title: "سنجش دلتا", durationMin: 10,
    questions: [
      { id: "x1", prompt: "در معادلهٔ x²−5x+6=0 مقدار دلتا چند است؟",
        options: ["1", "۴", "−۱", "۲۵"], answer: 0, conceptId: "c2", weight: 1 },
      { id: "x2", prompt: "ریشه‌های معادلهٔ بالا کدام‌اند؟",
        options: ["۲ و ۳", "−۲ و −۳", "۱ و ۶", "بدون ریشه"], answer: 0, conceptId: "c2", weight: 1 },
      { id: "x3", prompt: "رأس تابع y = x²−4x+1 کجاست؟",
        options: ["(۲, −۳)", "(−۲, ۳)", "(۴, ۱)", "(۰, ۱)"], answer: 0, conceptId: "c3", weight: 2 },
    ] },
  { id: "q2", courseId: "co13", title: "سنجش مشتق", durationMin: 12,
    questions: [
      { id: "y1", prompt: "مشتق تابع f(x)=x³ چیست؟",
        options: ["3x²", "x²", "3x", "x³/3"], answer: 0, conceptId: "c6", weight: 1 },
      { id: "y2", prompt: "نقطهٔ بحرانی f(x)=x²−6x کدام است؟",
        options: ["x=3", "x=6", "x=0", "x=−3"], answer: 0, conceptId: "c6", weight: 1 },
      { id: "y3", prompt: "مشتق تابع sin(x) چیست؟",
        options: ["cos(x)", "−sin(x)", "−cos(x)", "tan(x)"], answer: 0, conceptId: "c6", weight: 1 },
    ] },
  { id: "q3", courseId: "co9", title: "سنجش سلول", durationMin: 10,
    questions: [
      { id: "z1", prompt: "کدام اندامک مسئول تولید انرژی است؟",
        options: ["میتوکندری", "هسته", "ریبوزوم", "گلژی"], answer: 0, conceptId: "c11", weight: 1 },
      { id: "z2", prompt: "DNA در کدام بخش سلول قرار دارد؟",
        options: ["هسته", "سیتوپلاسم", "غشا", "ریبوزوم"], answer: 0, conceptId: "c11", weight: 1 },
    ] },
];

// ──────────────────────────────────────────────────────────
// نظرات — خالی (فقط نظرات واقعی کاربران در DB)
// ──────────────────────────────────────────────────────────
export const reviews: Review[] = [];

// ──────────────────────────────────────────────────────────
// کلاس‌های زنده (نمونه)
// ──────────────────────────────────────────────────────────
export const liveClasses: LiveClass[] = [
  { id: "lv1", title: "حل تمرین دلتا — زنده", courseId: "co6", teacherId: "u2",
    scheduledAt: "2026-11-02T18:00:00", durationMin: 90, capacity: 200, enrolled: 0,
    status: "upcoming", description: "مرور کامل دلتا + حل ۱۰ تست کنکوری از معادلهٔ درجه دو." },

  { id: "lv2", title: "شهود در قانون دوم نیوتن", courseId: "co7", teacherId: "u5",
    scheduledAt: "2026-11-03T17:30:00", durationMin: 75, capacity: 150, enrolled: 0,
    status: "upcoming", description: "چرا F=ma کار می‌کند؟ با مثال‌های روزمره و آزمایش ذهنی." },

  { id: "lv3", title: "سلول زیر میکروسکوپ", courseId: "co9", teacherId: "u7",
    scheduledAt: "2026-11-05T16:00:00", durationMin: 60, capacity: 100, enrolled: 0,
    status: "upcoming", description: "تور مجازی در سلول — اندامک‌ها و عملکردشان." },

  { id: "lv4", title: "مشتق — از صفر تا تست کنکور", courseId: "co13", teacherId: "u2",
    scheduledAt: "2026-10-28T19:00:00", durationMin: 120, capacity: 300, enrolled: 0,
    status: "ended", recordingUrl: "#recording",
    description: "این جلسه ضبط شده. به‌زودی قابل مشاهده." },

  { id: "lv5", title: "ژنتیک مندلی — سؤال‌های پرتکرار", courseId: "co14", teacherId: "u7",
    scheduledAt: "2026-11-08T18:00:00", durationMin: 90, capacity: 200, enrolled: 0,
    status: "upcoming", description: "با هم ۲۰ تست ژنتیک کنکور را حل می‌کنیم." },

  { id: "lv6", title: "آرایه‌های ادبی — تشخیص سریع", courseId: "co15", teacherId: "u8",
    scheduledAt: "2026-11-10T17:00:00", durationMin: 75, capacity: 180, enrolled: 0,
    status: "upcoming", description: "تکنیک‌های تشخیص آرایه در ۱۰ ثانیه." },
];

// ──────────────────────────────────────────────────────────
// مقالات
// ──────────────────────────────────────────────────────────
export const articles: Article[] = [
  { id: "a1", slug: "how-to-study-for-konkur", title: "چطور برای کنکور درس بخوانیم که فراموش نکنیم؟",
    excerpt: "یادگیری مؤثر، نه حفظ کردن. سه تکنیک علمی که رتبه‌های برتر استفاده می‌کنند.",
    content: `# چطور برای کنکور درس بخوانیم که فراموش نکنیم؟

کنکور فقط آزمون حافظه نیست — آزمون **مدیریت دانش** است. سه تکنیک که رتبه‌های برتر استفاده می‌کنند:

## ۱. مرور فاصله‌دار (Spaced Repetition)
به جای مرور پشت‌سرهم، در فاصله‌های ۱ روز، ۳ روز، ۱ هفته، ۲ هفته مرور کن. مغز چیزی را که دوباره می‌بیند، مهم تلقی می‌کند.

## ۲. یادآوری فعال (Active Recall)
به جای خواندن دوباره، کتاب را ببند و از خودت بپرس. این کار حافظه را ۲ برابر قوی‌تر می‌کند.

## ۳. تمرین درهم (Interleaving)
به جای ۱۰ تست از یک مبحث، ۳ تست از سه مبحث مختلف بزن. مغز یاد می‌گیرد تمایز بگذارد — همان چیزی که در کنکور لازم است.

## چرا نوترون؟
گراف دانش نوترون دقیقاً همین کار را می‌کند: نشان می‌دهد کدام پیش‌نیاز ضعیف است، و با سنجش‌های هدفمند، مرور فاصله‌دار را خودکار می‌کند.`,
    authorId: "u2", category: "روش مطالعه", cover: "lime", readMinutes: 6,
    publishedAt: "2026-10-15", tags: ["کنکور", "روش مطالعه", "حافظه"], featured: true },

  { id: "a2", slug: "delta-explained", title: "دلتا چیست و چرا این‌قدر مهم است؟",
    excerpt: "از معادلهٔ درجه دو تا سهمی — همه‌چیز به دلتا وصل است.",
    content: `# دلتا چیست و چرا این‌قدر مهم است؟

دلتا (Δ) در معادلهٔ درجه دو، **حلقهٔ اتصال** بین جبر و هندسه است.

## تعریف
برای معادلهٔ ax² + bx + c = 0، دلتا برابر است با **b² − 4ac**.

## سه حالت
- **Δ > 0**: دو ریشهٔ حقیقی متمایز. سهمی محور x را در دو نقطه قطع می‌کند.
- **Δ = 0**: یک ریشهٔ مضاعف. سهمی محور x را در رأس لمس می‌کند.
- **Δ < 0**: بدون ریشهٔ حقیقی. سهمی محور x را قطع نمی‌کند.

## چرا مهم است؟
دلتا به تو می‌گوید **قبل از حل**، چند جواب وجود دارد. این یعنی به جای حل کورکورانه، ابتدا نقشه می‌کشی.`,
    authorId: "u2", category: "ریاضی", cover: "sky", readMinutes: 4,
    publishedAt: "2026-10-20", tags: ["ریاضی", "معادلهٔ درجه دو", "دلتا"] },

  { id: "a3", slug: "newton-laws-intuition", title: "قوانین نیوتن — با شهود، نه فرمول",
    excerpt: "F=ma یک فرمول نیست، یک شهود است. بیا کشفش کنیم.",
    content: `# قوانین نیوتن — با شهود، نه فرمول

قانون دوم نیوتن (F = ma) شاید معروف‌ترین فرمول فیزیک باشد، ولی اگر شهود آن را نداشته باشی، فقط یک معادله است.

## سه قانون در یک جمله
- **اول**: جسم بدون نیرو، حالتش را حفظ می‌کند.
- **دوم**: نیرو، سرعت تغییر تکانه است (F = ma).
- **سوم**: هر کنشی، عکس‌العملی دارد.

## شهود یک
اگر توپی را در فضا رها کنی، تا ابد با همان سرعت می‌رود. این یعنی **حرکت، حالت طبیعی است، نه سکون**.`,
    authorId: "u5", category: "فیزیک", cover: "violet", readMinutes: 5,
    publishedAt: "2026-10-22", tags: ["فیزیک", "نیوتن", "مکانیک"] },

  { id: "a4", slug: "cell-101", title: "سلول ۱۰۱: از مولکول تا اندامک",
    excerpt: "سلول یک کارخانه است. بیا اتاق‌هایش را بشناسیم.",
    content: `# سلول ۱۰۱

سلول، واحد بنیادی حیات است. یک کارخانهٔ کامل در ۱۰ میکرومتر.

## اندامک‌های اصلی
- **هسته**: مدیر کارخانه — DNA اینجاست.
- **میتوکندری**: نیروگاه — ATP تولید می‌کند.
- **ریبوزوم**: کارگاه مونتاژ پروتئین.
- **گلژی**: بسته‌بندی و ارسال.

## چرا مهم است؟
برای فهم ژنتیک، ایمنی، و سرطان — اول باید سلول را بشناسی.`,
    authorId: "u7", category: "زیست", cover: "rose", readMinutes: 7,
    publishedAt: "2026-10-25", tags: ["زیست", "سلول", "پایهٔ دهم"] },

  { id: "a5", slug: "study-plan-30-days", title: "برنامهٔ ۳۰ روزهٔ مطالعه — قابل اجرا",
    excerpt: "به جای برنامهٔ ۱۰۰ صفحه‌ای، یک برنامهٔ ساده که واقعاً اجرا می‌شود.",
    content: `# برنامهٔ ۳۰ روزهٔ مطالعه

برنامه‌های بلند اجرا نمی‌شوند. برنامهٔ ۳۰ روزه، چون کوتاه است، اجرا می‌شود.

## ساختار
- **هفتهٔ ۱**: پایه‌ها. مفاهیم جدید + تمرین.
- **هفتهٔ ۲**: تمرین متمرکز. تست‌های هدفمند.
- **هفتهٔ ۳**: مرور و رفع شکاف. تمرکز روی نقاط ضعف.
- **هفتهٔ ۴**: شبیه‌سازی. آزمون کامل + تحلیل.

## نکتهٔ کلیدی
هر روز حداقل **۲۵ دقیقه** مطالعهٔ عمیق. کمتر، بی‌فایده است. بیشتر، پایدار نیست.`,
    authorId: "u2", category: "روش مطالعه", cover: "amber", readMinutes: 5,
    publishedAt: "2026-10-27", tags: ["برنامه", "مطالعه", "۳۰ روز"] },

  { id: "a6", slug: "arabic-without-memorization", title: "عربی بدون حفظ کردن — ممکن است؟",
    excerpt: "صرف و نحو، اگر منطقش را بفهمی، حفظ کردن ندارد.",
    content: `# عربی بدون حفظ کردن

اکثر دانش‌آموزان عربی را حفظ می‌کنند و بعد فراموش می‌کنند. ولی عربی یک **سیستم منطقی** است.

## سه گام
1. **ریشه‌شناسی**: هر کلمه از یک ریشه می‌آید. ریشه را بلد باش، خانواده را می‌شناسی.
2. **الگو (وزن)**: افعال و اسم‌ها الگو دارند. الگو را بلد باش، صرف را می‌سازی.
3. **ترجمه**: از کل به جزء، نه کلمه به کلمه.

## نتیجه
با فهم سیستم، ۸۰٪ قواعد را بدون حفظ کردن می‌سازی.`,
    authorId: "u9", category: "عربی", cover: "lime", readMinutes: 6,
    publishedAt: "2026-10-28", tags: ["عربی", "قواعد", "بدون حفظ"] },
];

// ──────────────────────────────────────────────────────────
// آزمون‌های آزمایشی
// ──────────────────────────────────────────────────────────
export const mockExams: MockExam[] = [
  { id: "me1", title: "آزمون آزمایشی سراسری — ریاضی دوازدهم", grade: 12, major: "ریاضی",
    scheduledAt: "2026-11-07T08:00:00", durationMin: 240, questionCount: 80,
    registered: 0, capacity: 2000, status: "upcoming",
    subjects: ["ریاضی", "فیزیک", "شیمی"], description: "شبیه‌سازی کامل کنکور ریاضی با کارنامهٔ تحلیلی.",
    fee: 0 },

  { id: "me2", title: "آزمون آزمایشی سراسری — تجربی دوازدهم", grade: 12, major: "تجربی",
    scheduledAt: "2026-11-07T08:00:00", durationMin: 240, questionCount: 100,
    registered: 0, capacity: 4000, status: "upcoming",
    subjects: ["زیست", "ریاضی", "فیزیک", "شیمی"], description: "شبیه‌سازی کامل کنکور تجربی با کارنامهٔ تحلیلی.",
    fee: 0 },

  { id: "me3", title: "آزمون آزمایشی — دهم تجربی", grade: 10, major: "تجربی",
    scheduledAt: "2026-11-14T09:00:00", durationMin: 180, questionCount: 60,
    registered: 0, capacity: 1500, status: "upcoming",
    subjects: ["زیست", "ریاضی", "شیمی"], description: "مرور سه درس اصلی با تحلیل شکاف.",
    fee: 0 },

  { id: "me4", title: "آزمون آزمایشی — یازدهم ریاضی", grade: 11, major: "ریاضی",
    scheduledAt: "2026-11-21T09:00:00", durationMin: 200, questionCount: 70,
    registered: 0, capacity: 1200, status: "upcoming",
    subjects: ["ریاضی", "فیزیک"], description: "تمرین شبیه‌سازی کنکور برای پایهٔ یازدهم.",
    fee: 0 },

  { id: "me5", title: "آزمون آزمایشی — نهم", grade: 9, major: "عمومی",
    scheduledAt: "2026-11-12T10:00:00", durationMin: 120, questionCount: 40,
    registered: 0, capacity: 3000, status: "upcoming",
    subjects: ["ریاضی", "علوم"], description: "آزمون نمونه برای آشنایی با ساختار.",
    fee: 0 },

  { id: "me6", title: "آزمون آزمایشی — دوازدهم انسانی", grade: 12, major: "انسانی",
    scheduledAt: "2026-11-15T08:00:00", durationMin: 220, questionCount: 80,
    registered: 0, capacity: 1000, status: "upcoming",
    subjects: ["ادبیات", "عربی", "تاریخ", "جغرافیا"], description: "شبیه‌سازی کنکور انسانی با کارنامهٔ تفکیکی.",
    fee: 0 },
];

// ──────────────────────────────────────────────────────────
// تیکت‌های نمونه (خالی — فقط از DB)
// ──────────────────────────────────────────────────────────
export const supportTickets: SupportTicket[] = [];

// ──────────────────────────────────────────────────────────
// توابع کمکی
// ──────────────────────────────────────────────────────────
export const getCourse = (id: string) => courses.find(c => c.id === id);
export const getTeacher = (id: string) => users.find(u => u.id === id);
export const getReviews = (courseId: string) => reviews.filter(r => r.courseId === courseId);
export const getCourseQuizzes = (courseId: string, extra: Quiz[] = []) =>
  [...quizzes, ...extra].filter(q => q.courseId === courseId);
export const getArticle = (slug: string) => articles.find(a => a.slug === slug);
export const getLiveForTeacher = (teacherId: string) =>
  liveClasses.filter(l => l.teacherId === teacherId);
export const getMockForGrade = (grade: number) =>
  mockExams.filter(m => m.grade === grade);

export const GRADES = [6, 7, 8, 9, 10, 11, 12] as const;
export const MAJORS = ["عمومی", "ریاضی", "تجربی", "انسانی", "فنی", "هنر"] as const;

export function gradeLabel(g: number): string {
  const names: Record<number, string> = {
    6: "ششم", 7: "هفتم", 8: "هشتم", 9: "نهم",
    10: "دهم", 11: "یازدهم", 12: "دوازدهم",
  };
  return names[g] ?? String(g);
}

/** رشته‌های معتبر بر اساس پایه */
export function majorsForGrade(grade: number): string[] {
  if (grade <= 9) return ["عمومی"];
  return ["ریاضی", "تجربی", "انسانی", "فنی", "هنر"];
}