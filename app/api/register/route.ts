import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbGetActiveSubscription, dbCreateRegistration, dbHasRegistration } from "@/lib/db-file";

const Body = z.object({
  type: z.enum(["mock", "live"]),
  id: z.string().min(1).max(64),
});

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sub = dbGetActiveSubscription(s.userId);
  if (!sub) {
    return NextResponse.json(
      { error: "برای ثبت‌نام باید اشتراک فعال داشته باشی." },
      { status: 403 }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });
  }

  const { type, id } = parsed.data;

  if (dbHasRegistration(s.userId, id, type)) {
    return NextResponse.json({ ok: true, alreadyRegistered: true });
  }

  dbCreateRegistration({ userId: s.userId, examId: id, examType: type });
  console.log(`[Register] ${s.name} → ${type} ${id}`);
  return NextResponse.json({ ok: true });
}