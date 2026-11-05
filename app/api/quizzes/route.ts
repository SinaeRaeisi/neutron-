import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbListCustomQuizzes, dbCreateCustomQuiz } from "@/lib/db-file";
import { quizzes as demoQuizzes } from "@/lib/data";

const Q = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  answer: z.number().int().min(0),
  conceptId: z.string().min(1),
  weight: z.number().int().min(1).max(10),
});

const Body = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  courseId: z.string().min(1),
  durationMin: z.number().int().min(1).max(180),
  questions: z.array(Q).min(1),
});

export async function GET() {
  const custom = await dbListCustomQuizzes(); // ← await
  const all = [...demoQuizzes, ...custom];
  return NextResponse.json({ quizzes: all });
}

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s || (s.role !== "teacher" && s.role !== "admin")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });

  const created = await dbCreateCustomQuiz(parsed.data as any); // ← await
  return NextResponse.json({ ok: true, quiz: created });
}