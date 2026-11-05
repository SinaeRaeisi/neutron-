import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import {
  dbGetPendingPayment, dbUpdatePendingPayment, dbCreateSubscription,
  dbGetUserById, dbCreateNotification,
} from "@/lib/db-file";
import { planName, type PlanId } from "@/lib/plans";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s || s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payment = await dbGetPendingPayment(params.id); // ← await
  if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (payment.status !== "pending_review") return NextResponse.json({ error: "این پرداخت قابل تأیید نیست." }, { status: 400 });

  const user = await dbGetUserById(payment.userId); // ← await
  if (!user?.grade || !user?.major) return NextResponse.json({ error: "پروفایل کاربر ناقص است." }, { status: 400 });

  const sub = await dbCreateSubscription({ // ← await
    userId: payment.userId,
    plan: payment.plan as PlanId,
    grade: user.grade,
    major: user.major,
    months: payment.months,
    price: payment.price,
  });

  await dbUpdatePendingPayment(payment.id, { // ← await
    status: "approved",
    reviewedAt: new Date().toISOString(),
  });

  await dbCreateNotification({ // ← await
    userId: payment.userId,
    title: "اشتراک فعال شد",
    body: `اشتراک ${planName[payment.plan as PlanId]} برای ${payment.months} ماه فعال شد.`,
    href: "/app/subscription",
  });

  return NextResponse.json({ ok: true, subscription: sub });
}