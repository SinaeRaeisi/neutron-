import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifyPending, signSession, setSessionCookie, clearPendingCookie } from "@/lib/auth";
import { dbCreateUserWithEmail } from "@/lib/db-file";
import { sendWelcomeEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import type { Grade, Major } from "@/lib/types";

const VALID_GRADES = [6, 7, 8, 9, 10, 11, 12];
const VALID_MAJORS: Major[] = ["عمومی", "ریاضی", "تجربی", "انسانی", "فنی", "هنر"];

const Body = z.object({
  name: z.string().min(2).max(80),
  grade: z.number().int().refine(g => VALID_GRADES.includes(g), { message: "پایهٔ نامعتبر" }),
  major: z.string().refine(m => VALID_MAJORS.includes(m as Major), { message: "رشتهٔ نامعتبر" }),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: "تعداد تلاش زیاد." }, { status: 429 });

    const pending = cookies().get("n_pending")?.value;
    if (!pending) return NextResponse.json({ error: "ابتدا با ایمیل وارد شو." }, { status: 401 });

    const verified = await verifyPending(pending);
    if (!verified) return NextResponse.json({ error: "جلسه منقضی. دوباره." }, { status: 401 });

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر." }, { status: 400 });
    }

    const user = await dbCreateUserWithEmail({
      name: parsed.data.name.trim(),
      email: verified.email,
      grade: parsed.data.grade as Grade,
      major: parsed.data.major as Major,
      phone: parsed.data.phone?.trim() || undefined,
    });

    const token = await signSession({ userId: user.id, role: user.role, name: user.name }, true);
    await setSessionCookie(token, true);
    clearPendingCookie();

    sendWelcomeEmail(user.email!, user.name).catch(e => console.error("[register welcome]", e));

    console.log(`[register] ${user.name} (${user.email}) پایهٔ ${user.grade} ${user.major}`);
    return NextResponse.json({ ok: true, role: user.role, name: user.name });
  } catch (e: any) {
    if (e instanceof Error && e.message === "duplicate-email") {
      return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده." }, { status: 409 });
    }
    console.error("[register] EXCEPTION:", e);
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}