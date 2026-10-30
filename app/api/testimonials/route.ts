import { NextResponse } from "next/server";
import { z } from "zod";
import { dbCreateTestimonial, dbListVisibleTestimonials } from "@/lib/db-file";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const Body = z.object({
  name: z.string().min(2).max(60),
  role: z.string().min(2).max(60),
  text: z.string().min(5).max(500),
  rating: z.number().int().min(1).max(5),
});

/** عمومی — فقط ۵ ستاره‌ها */
export async function GET() {
  return NextResponse.json({ testimonials: dbListVisibleTestimonials() });
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`testimonial:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "تعداد درخواست زیاد." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });

  dbCreateTestimonial(parsed.data);
  // پیام یکسان برای همه — کاربر نمی‌فهمد فقط ۵ ستاره‌ها نمایش داده می‌شوند
  return NextResponse.json({ ok: true, message: "نظر شما ثبت شد. ممنون!" });
}