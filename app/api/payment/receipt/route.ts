import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbGetPendingPayment, dbUpdatePendingPayment } from "@/lib/db-file";

const Body = z.object({
  paymentId: z.string().min(3),
  receiptUrl: z.string().min(3),
  receiptName: z.string().min(1),
});

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });

  const payment = dbGetPendingPayment(parsed.data.paymentId);
  if (!payment) return NextResponse.json({ error: "پرداخت یافت نشد." }, { status: 404 });
  if (payment.userId !== s.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (payment.status !== "pending_receipt") {
    return NextResponse.json({ error: "این پرداخت قبلاً ثبت شده." }, { status: 400 });
  }

  const updated = dbUpdatePendingPayment(payment.id, {
    status: "pending_review",
    receiptUrl: parsed.data.receiptUrl,
    receiptName: parsed.data.receiptName,
  });

  return NextResponse.json({ ok: true, payment: updated });
}