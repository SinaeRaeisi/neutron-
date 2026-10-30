import { NextResponse } from "next/server";
import { quizzes as demoQuizzes } from "@/lib/data";
import { dbGetCustomQuiz } from "@/lib/db-file";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const quiz = demoQuizzes.find(q => q.id === params.id) ?? dbGetCustomQuiz(params.id);
  if (!quiz) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ quiz });
}