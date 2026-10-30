import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbUpdateMockExam, dbDeleteMockExam } from "@/lib/db-file";

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
  capacity: z.number().int().min(1).max(100000),
  subjects: z.array(z.string()).optional().default(["عمومی"]),
  description: z.string().max(500).optional().default(""),
  fee: z.number().int().min(0),
  questions: z.array(Q).min(1),
});

async function authAdmin() {
  const token = cookies().get("n_session")?.value;
  if (!token) return { error: "unauthorized", status: 401 } as const;
  const s = await verifySession(token);
  if (!s) return { error: "unauthorized", status: 401 } as const;
  if (s.role !== "admin") return { error: "forbidden", status: 403 } as const;
  return { ok: true } as const;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const a = await authAdmin();
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: a.status });

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

  const updated = dbUpdateMockExam(params.id, {
    ...parsed.data,
    grade: parsed.data.grade as any,
    major: parsed.data.major as any,
    questionCount: parsed.data.questions.length,
  });
  if (!updated) return NextResponse.json({ error: "یافت نشد." }, { status: 404 });
  return NextResponse.json({ ok: true, exam: updated });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const a = await authAdmin();
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const ok = dbDeleteMockExam(params.id);
  if (!ok) return NextResponse.json({ error: "یافت نشد." }, { status: 404 });
  return NextResponse.json({ ok: true });
}