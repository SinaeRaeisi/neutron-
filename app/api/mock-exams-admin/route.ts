import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbCreateCustomMockExam, dbListCustomMockExams } from "@/lib/db-file";

const Q = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  answer: z.number().int().min(0),
  conceptId: z.string().min(1),
  weight: z.number().int().min(1).max(10),
});

const Body = z.object({
  title: z.string().min(3).max(150),
  grade: z.number().int(),
  major: z.string().min(1),
  scheduledAt: z.string().min(10),
  durationMin: z.number().int().min(30).max(300),
  questionCount: z.number().int().min(1).max(200),
  capacity: z.number().int().min(1).max(100000),
  subjects: z.array(z.string()).optional().default(["عمومی"]),
  description: z.string().max(500).optional().default("آزمون آزمایشی NEUTRON"),
  fee: z.number().int().min(0),
  questions: z.array(Q).min(1),
});

export async function GET() {
  const token = cookies().get("n_session")?.value;
  let isAdmin = false;
  if (token) {
    try {
      const s = await verifySession(token);
      if (s?.role === "admin") isAdmin = true;
    } catch { /* noop */ }
  }

  const all = await dbListCustomMockExams();
  const now = Date.now();

  const sanitize = (ex: any) => {
    if (isAdmin) return ex;

    const startMs = new Date(ex.scheduledAt).getTime();
    const endMs = startMs + ex.durationMin * 60 * 1000;
    const inWindow = now >= startMs - 15 * 60 * 1000 && now <= endMs;

    return {
      ...ex,
      questionCount: ex.questions?.length ?? ex.questionCount ?? 0,
      questions: inWindow && Array.isArray(ex.questions)
        ? ex.questions.map(({ answer, ...q }: any) => ({ ...q, answer: -1 }))
        : undefined,
    };
  };

  return NextResponse.json({ exams: all.map(sanitize) });
}

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: `اطلاعات نامعتبر: ${issue?.path.join(".")} — ${issue?.message}` },
      { status: 400 }
    );
  }

  const exam = await dbCreateCustomMockExam({
    id: "me-" + Math.random().toString(36).slice(2, 8),
    title: parsed.data.title,
    grade: parsed.data.grade as any,
    major: parsed.data.major as any,
    scheduledAt: new Date(parsed.data.scheduledAt), // ← تبدیل به Date برای Prisma
    durationMin: parsed.data.durationMin,
    questionCount: parsed.data.questionCount,
    registered: 0,
    capacity: parsed.data.capacity,
    status: "upcoming",
    subjects: parsed.data.subjects,
    description: parsed.data.description,
    fee: parsed.data.fee,
    questions: parsed.data.questions as any,
  });

  return NextResponse.json({ ok: true, exam });
}