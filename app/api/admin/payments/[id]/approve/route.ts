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
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payment = dbGetPendingPayment(params.id);
  if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (payment.status !== "pending_review") {
    return NextResponse.json({ error: "این پرداخت قابل تأیید نیست." }, { status: 400 });
  }

  const user = dbGetUserById(payment.userId);
  if (!user?.grade || !user?.major) {
    return NextResponse.json({ error: "پروفایل کاربر ناقص است." }, { status: 400 });
  }

  const sub = dbCreateSubscription({
    userId: payment.userId,
    plan: payment.plan as PlanId,
    grade: user.grade,
    major: user.major,
    months: payment.months,
    price: payment.price,
  });

  dbUpdatePendingPayment(payment.id, {
    status: "approved",
    reviewedAt: new Date().toISOString(),
  });

  // 🔔 اعلان به کاربر
  dbCreateNotification({
    userId: payment.userId,
    title: "اشتراک فعال شد",
    body: `اشتراک ${planName[payment.plan as PlanId]} برای ${payment.months} ماه فعال شد. حالا به همهٔ محتوا دسترسی داری.`,
    href: "/app/subscription",
  });

  return NextResponse.json({ ok: true, subscription: sub });
}