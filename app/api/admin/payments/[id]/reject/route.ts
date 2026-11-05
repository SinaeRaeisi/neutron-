import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbGetPendingPayment, dbUpdatePendingPayment } from "@/lib/db-file";

const Body = z.object({ note: z.string().max(500).optional().default("") });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payment = await dbGetPendingPayment(params.id);
  if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { /* allow empty */ }
  const parsed = Body.safeParse(body ?? {});

  const updated = await dbUpdatePendingPayment(payment.id, {
    status: "rejected",
    reviewedAt: new Date().toISOString(),
    reviewNote: parsed.success ? parsed.data.note : "",
  });

  return NextResponse.json({ ok: true, payment: updated });
}