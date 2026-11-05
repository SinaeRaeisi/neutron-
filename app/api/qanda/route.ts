import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbCreateQuestion, dbListQandA, dbGetActiveSubscription } from "@/lib/db-file";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const questions = await dbListQandA(); // ← await اضافه شد
  return NextResponse.json({ questions });
}

const Body = z.object({
  title: z.string().min(5).max(200),
  body: z.string().min(10).max(5000),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 🔒 چک اشتراک
  const sub = await dbGetActiveSubscription(s.userId);
  if (!sub) {
    return NextResponse.json(
      { error: "برای ثبت سؤال، اشتراک فعال لازم است.", code: "subscription_required" },
      { status: 403 }
    );
  }

  const rl = rateLimit(`qanda-new:${s.userId}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "تعداد سؤال در ساعت زیاد است. کمی بعد." }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر." },
      { status: 400 }
    );
  }

  const q = await dbCreateQuestion({
    userId: s.userId,
    userName: s.name,
    userRole: s.role as "student" | "teacher" | "admin",
    courseId: parsed.data.courseId,
    lessonId: parsed.data.lessonId,
    title: parsed.data.title.trim(),
    body: parsed.data.body.trim(),
    tags: parsed.data.tags.map(t => t.trim()).filter(Boolean),
  });
  return NextResponse.json({ ok: true, question: q });
}