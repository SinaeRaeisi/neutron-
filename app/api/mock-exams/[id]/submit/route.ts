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

/** جست‌وجوی چندلایه — دمو، DB-file، و خواندن مستقیم فایل */
function findExam(id: string): any | null {
  // ۱. دمو
  const demo = mockExams.find(m => m.id === id);
  if (demo && demo.questions && demo.questions.length > 0) return demo;

  // ۲. db-file
  const custom = dbListCustomMockExams().find(m => m.id === id);
  if (custom && custom.questions && custom.questions.length > 0) return custom;

  // ۳. خواندن مستقیم فایل (fallback)
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const db = JSON.parse(raw);
    const direct = (db.customMockExams ?? []).find((m: any) => m.id === id);
    if (direct && direct.questions && direct.questions.length > 0) return direct;
  } catch { /* noop */ }

  return demo ?? custom ?? null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sub = dbGetActiveSubscription(s.userId);
  if (!sub) return NextResponse.json({ error: "اشتراک لازم است." }, { status: 403 });

  if (!dbHasRegistration(s.userId, params.id, "mock")) {
    return NextResponse.json({ error: "اول در آزمون ثبت‌نام کن." }, { status: 403 });
  }

  const exam = findExam(params.id);
  if (!exam) {
    console.log(`[mock-submit] NOT FOUND: ${params.id}`);
    return NextResponse.json({ error: "آزمون یافت نشد." }, { status: 404 });
  }
  if (!exam.questions || exam.questions.length === 0) {
    console.log(`[mock-submit] NO QUESTIONS: ${params.id}`);
    return NextResponse.json({ error: "سؤال‌های این آزمون در دسترس نیست." }, { status: 400 });
  }

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

  const attempt = dbSaveMockAttempt({
    userId: s.userId,
    examId: params.id,
    answers: parsed.data.answers,
    score,
  });

  console.log(`[mock-submit] user=${s.name} exam=${params.id} score=${score}`);
  return NextResponse.json({ ok: true, attempt, correct, total: exam.questions.length });
}