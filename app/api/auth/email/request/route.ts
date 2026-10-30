import { NextResponse } from "next/server";
import { z } from "zod";
import { requestEmailOtp, normalizeEmail } from "@/lib/email-otp";
import { sendOtpEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const Body = z.object({ email: z.string().min(5).max(200) });

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`email-req:${ip}`, 5, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ error: "تعداد درخواست بیش از حد." }, { status: 429 });
    }

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = Body.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "ایمیل نامعتبر." }, { status: 400 });

    const norm = normalizeEmail(parsed.data.email);
    if (!norm) return NextResponse.json({ error: "ایمیل نامعتبر." }, { status: 400 });

    const result = requestEmailOtp(norm);
    if (!result.ok) {
      if (result.reason === "cooldown") {
        return NextResponse.json(
          { error: `لطفاً ${result.cooldownLeftSec} ثانیه دیگر.`, cooldownLeftSec: result.cooldownLeftSec },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "درخواست ناموفق." }, { status: 400 });
    }

    const emailResult = await sendOtpEmail(norm, result.code!);
    if (!emailResult.ok) {
      console.error("[email request] send failed:", emailResult.error);
      return NextResponse.json(
        { error: "ارسال ایمیل ناموفق. کمی بعد امتحان کن." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (e: any) {
    console.error("[email request] EXCEPTION:", e);
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}