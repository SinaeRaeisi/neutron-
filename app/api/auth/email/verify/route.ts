import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailOtp, normalizeEmail } from "@/lib/email-otp";
import { signSession, setSessionCookie, signPending, setPendingCookie } from "@/lib/auth";
import { dbGetUserByEmail } from "@/lib/db-file";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const Body = z.object({
  email: z.string().min(5).max(200),
  code: z.string().regex(/^\d{6}$/),
  remember: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`email-verify:${ip}`, 10, 10 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: "تعداد تلاش زیاد." }, { status: 429 });

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = Body.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });

    const norm = normalizeEmail(parsed.data.email);
    if (!norm) return NextResponse.json({ error: "ایمیل نامعتبر." }, { status: 400 });

    const v = verifyEmailOtp(norm, parsed.data.code);
    if (!v.ok) {
      const msgs: Record<string, string> = {
        no_code: "کدی درخواست نشده.",
        expired: "کد منقضی.",
        wrong: `کد اشتباه. ${v.attemptsLeft ?? 0} تلاش.`,
        too_many_attempts: "تلاش زیاد.",
      };
      return NextResponse.json({ error: msgs[v.reason ?? "no_code"] }, { status: 401 });
    }

    const existing = dbGetUserByEmail(norm);
    if (existing) {
      const token = await signSession(
        { userId: existing.id, role: existing.role, name: existing.name },
        parsed.data.remember
      );
      await setSessionCookie(token, parsed.data.remember);
      console.log(`[email] login ${existing.email} (${existing.role})`);
      return NextResponse.json({
        ok: true,
        role: existing.role,
        name: existing.name,
      });
    }

    // کاربر جدید → pending
    const pending = await signPending(norm);
    setPendingCookie(pending);
    return NextResponse.json({
      ok: true,
      needsRegistration: true,
      email: norm,
    });
  } catch (e: any) {
    console.error("[email verify] EXCEPTION:", e);
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}