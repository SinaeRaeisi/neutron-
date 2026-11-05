import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { verifySession } from "@/lib/auth";
import {
  dbGetActiveSubscription, dbSaveMockAttempt, dbHasRegistration, dbListCustomMockExams,
} from "@/lib/db-file";
import { mockExams } from "@/lib/data";

const Body = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(20)),
});

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

// ← این تابع باید async باشد
async function findExam(id: string): Promise<any | null> {
  const demo = mockExams.find(m => m.id === id);
  if (demo && demo.questions && demo.questions.length > 0) return demo;

  const allCustom = await dbListCustomMockExams();
  const custom = allCustom.find(m => m.id === id);
  if (custom && custom.questions && (custom.questions as any[]).length > 0) return custom;

  return demo ?? custom ?? null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sub = await dbGetActiveSubscription(s.userId);
  if (!sub) return NextResponse.json({ error: "اشتراک لازم است." }, { status: 403 });

  if (!(await dbHasRegistration(s.userId, params.id, "mock"))) {
    return NextResponse.json({ error: "اول در آزمون ثبت‌نام کن." }, { status: 403 });
  }

  const exam = await findExam(params.id); // ← await اینجا لازم بود
  if (!exam) return NextResponse.json({ error: "آزمون یافت نشد." }, { status: 404 });
  if (!exam.questions || exam.questions.length === 0) return NextResponse.json({ error: "سؤال‌های این آزمون در دسترس نیست." }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid answers." }, { status: 400 });

  let correct = 0;
  for (const q of exam.questions) {
    if (parsed.data.answers[q.id] === q.answer) correct++;
  }
  const score = Math.round((correct / exam.questions.length) * 100);

  const attempt = await dbSaveMockAttempt({
    userId: s.userId,
    examId: params.id,
    answers: parsed.data.answers,
    score,
  });

  return NextResponse.json({ ok: true, attempt, correct, total: exam.questions.length });
}