import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { dbDeleteQuestion, dbGetQuestion } from "@/lib/db-file";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = await dbGetQuestion(params.id);
  if (!q) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (q.userId !== s.userId && s.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  dbDeleteQuestion(params.id);
  return NextResponse.json({ ok: true });
}