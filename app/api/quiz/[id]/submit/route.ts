import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { quizzes as demoQuizzes, concepts } from "@/lib/data";
import { dbGetCustomQuiz } from "@/lib/db-file";

const Body = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(20)),
});

const recentSubmissions = new Map<string, number>();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let session;
  try { session = await requireSession(); } catch (e) {
    return e instanceof Response ? e : new NextResponse("Unauthorized", { status: 401 });
  }

  const rl = rateLimit(`quiz-submit:${session.userId}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many submissions." }, { status: 429 });

  const idemKey = `${session.userId}:${params.id}`;
  const last = recentSubmissions.get(idemKey);
  const now = Date.now();
  if (last && now - last < 5_000) return NextResponse.json({ error: "Submission in progress." }, { status: 409 });
  recentSubmissions.set(idemKey, now);

  // ابتدا دمو، سپس سفارشی
  let quiz = demoQuizzes.find(q => q.id === params.id);
  if (!quiz) {
    quiz = (await dbGetCustomQuiz(params.id)) as any; // ← await
  }

  if (!quiz) {
    return NextResponse.json({ error: "این آزمون در سرور یافت نشد." }, { status: 404 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid answers." }, { status: 400 });

  const totalWeight = quiz.questions.reduce((s: number, q: any) => s + q.weight, 0);
  let gained = 0;
  const gaps: string[] = [];
  const missing: string[] = [];

  for (const q of quiz.questions) {
    const chosen = parsed.data.answers[q.id];
    if (chosen === undefined) { missing.push(q.id); continue; }
    if (chosen === q.answer) gained += q.weight;
    else gaps.push(q.conceptId);
  }

  if (missing.length > 0) return NextResponse.json({ error: "Some questions are unanswered.", missing }, { status: 400 });

  const score = totalWeight > 0 ? Math.round((gained / totalWeight) * 100) : 0;

  return NextResponse.json({
    ok: true, quizId: quiz.id, score,
    gaps: Array.from(new Set(gaps)),
    submittedAt: new Date().toISOString(),
    conceptTitles: Object.fromEntries(
      concepts.filter(c => gaps.includes(c.id)).map(c => [c.id, c.title])
    ),
  });
}