import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import {
  dbCreateAnswer, dbGetQuestion, dbListAnswers, dbGetActiveSubscription,
} from "@/lib/db-file";

const Body = z.object({
  body: z.string().min(5).max(5000),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ answers: dbListAnswers(params.id) });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 🔒 چک اشتراک (معلم و مدیر معاف)
  if (s.role === "student") {
    const sub = await dbGetActiveSubscription(s.userId);
    if (!sub) {
      return NextResponse.json(
        { error: "برای ارسال پاسخ، اشتراک فعال لازم است.", code: "subscription_required" },
        { status: 403 }
      );
    }
  }

  const q = await dbGetQuestion(params.id);
  if (!q) return NextResponse.json({ error: "سؤال یافت نشد." }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "پاسخ نامعتبر." }, { status: 400 });
  }

  const a = await dbCreateAnswer({
    questionId: params.id,
    userId: s.userId,
    userName: s.name,
    userRole: s.role as "student" | "teacher" | "admin",
    body: parsed.data.body.trim(),
  });
  return NextResponse.json({ ok: true, answer: a });
}