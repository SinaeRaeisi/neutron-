import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbGetUserById, dbCreatePendingPayment } from "@/lib/db-file";
import { plans, calcPrice, durations, type PlanId } from "@/lib/plans";

const Body = z.object({
  plan: z.enum(["basic", "pro", "vip"]),
  months: z.union([z.literal(1), z.literal(3), z.literal(6)]),
});

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await dbGetUserById(s.userId); // ← await
  if (!user?.grade || !user?.major) {
    return NextResponse.json({ error: "اول پروفایل را کامل کن." }, { status: 400 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });

  const plan = plans.find(p => p.id === parsed.data.plan);
  if (!plan) return NextResponse.json({ error: "پلن یافت نشد." }, { status: 404 });

  const months = parsed.data.months;
  if (!durations.some(d => d.months === months)) {
    return NextResponse.json({ error: "مدت نامعتبر." }, { status: 400 });
  }

  const price = calcPrice(plan, months);
  const payment = await dbCreatePendingPayment({ // ← await
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    plan: plan.id as PlanId,
    months,
    price,
  });

  return NextResponse.json({
    ok: true,
    payment: { id: payment.id, plan: plan.id, planName: plan.name, months, price },
    bank: {
      cardNumber: process.env.PAYMENT_CARD_NUMBER ?? "—",
      cardOwner: process.env.PAYMENT_CARD_OWNER ?? "—",
      bankName: process.env.PAYMENT_BANK_NAME ?? "—",
      sheba: process.env.PAYMENT_SHEBA ?? "—",
    },
  });
}