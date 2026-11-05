import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbGetLiveClassById, dbUpdateLiveClass, dbDeleteLiveClass } from "@/lib/db-file";

const Body = z.object({
  title: z.string().min(3).max(120),
  courseId: z.string().min(1),
  scheduledAt: z.string().min(10),
  durationMin: z.number().int().min(15).max(240),
  capacity: z.number().int().min(1).max(10000),
  description: z.string().max(500).optional().default(""),
  requiredQuizId: z.string().optional(),
  notes: z.string().max(5000).optional().default(""),
  attachments: z.array(z.object({
    id: z.string(), name: z.string(), url: z.string(),
    size: z.number(), type: z.string(),
  })).optional().default([]),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const l = await dbGetLiveClassById(params.id);
  if (!l) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ live: l });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await dbGetLiveClassById(params.id);
  if (!existing) return NextResponse.json({ error: "یافت نشد." }, { status: 404 });
  if (s.role !== "admin" && existing.teacherId !== s.userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });
  }

  const updated = await dbUpdateLiveClass(params.id, {
    ...parsed.data,
    requiredQuizId: parsed.data.requiredQuizId || undefined,
  });
  return NextResponse.json({ ok: true, live: updated });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await dbGetLiveClassById(params.id);
  if (!existing) return NextResponse.json({ error: "یافت نشد." }, { status: 404 });
  if (s.role !== "admin" && existing.teacherId !== s.userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  dbDeleteLiveClass(params.id);
  return NextResponse.json({ ok: true });
}