export const IRAN_TZ = "Asia/Tehran";

/** تاریخ ایران به‌صورت خوانا */
export function formatIranDate(
  iso: string,
  opts?: Intl.DateTimeFormatOptions
): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fa-IR", {
    timeZone: IRAN_TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
    ...opts,
  });
}

/** ساعت ایران */
export function formatIranTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fa-IR", {
    timeZone: IRAN_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** باقی‌مانده تا یک تاریخ، به دقیقه (منفی = گذشته) */
export function minutesUntil(iso: string, fromMs = Date.now()): number {
  const target = new Date(iso).getTime();
  return Math.ceil((target - fromMs) / 60_000);
}

/** متن فارسی باقی‌مانده */
export function remainingText(iso: string, fromMs = Date.now()): string {
  const m = minutesUntil(iso, fromMs);
  if (m <= 0) return "گذشته";
  if (m < 60) return `${m.toLocaleString("fa-IR")} دقیقه`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (mm === 0) return `${h.toLocaleString("fa-IR")} ساعت`;
  return `${h.toLocaleString("fa-IR")} ساعت و ${mm.toLocaleString("fa-IR")} دقیقه`;
}

/** الان در ایران، ISO */
export function nowIso(): string {
  return new Date().toISOString();
}