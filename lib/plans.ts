export type PlanId = "basic" | "pro" | "vip";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  pricePerMonth: number;
  color: "sky" | "lime" | "violet";
  highlight?: boolean;
  features: string[];
}

export const plans: Plan[] = [
  {
    id: "basic", name: "پایه", color: "sky",
    tagline: "شروع کن — محتوای پایهٔ خودت",
    pricePerMonth: 149_000,
    features: [
      "همهٔ دوره‌های پایهٔ خودت",
      "درس‌ها و سنجش‌های کوتاه",
      "تاریخچه و پیشرفت",
      "۱ استاد انتخابی",
    ],
  },
  {
    id: "pro", name: "حرفه‌ای", color: "lime", highlight: true,
    tagline: "برای جدی‌ها — محتوا + آزمون آزمایشی",
    pricePerMonth: 289_000,
    features: [
      "همهٔ ویژگی‌های «پایه»",
      "آزمون‌های آزمایشی با کارنامه",
      "همهٔ مدرسان برای انتخاب",
      "کل مجله و مقالات",
      "تحلیل شکاف هفتگی",
    ],
  },
  {
    id: "vip", name: "ویژه", color: "violet",
    tagline: "تجربهٔ کامل — کلاس زنده + پشتیبانی",
    pricePerMonth: 549_000,
    features: [
      "همهٔ ویژگی‌های «حرفه‌ای»",
      "کلاس‌های زنده + ضبط‌شده",
      "پشتیبانی اولویت‌دار",
      "مسیر یادگیری اختصاصی",
      "دسترسی زودهنگام به دوره‌های جدید",
    ],
  },
];

export const durations = [
  { months: 1, label: "۱ ماه", discount: 0 },
  { months: 3, label: "۳ ماه", discount: 10 },
  { months: 6, label: "۶ ماه", discount: 20 },
] as const;

export function calcPrice(plan: Plan, months: number): number {
  const d = durations.find(x => x.months === months);
  const base = plan.pricePerMonth * months;
  return Math.round(base * (1 - (d?.discount ?? 0) / 100));
}

export const planName: Record<PlanId, string> = {
  basic: "پایه", pro: "حرفه‌ای", vip: "ویژه",
};