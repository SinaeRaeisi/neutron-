import { NextResponse } from "next/server";
import { z } from "zod";
import { signSession, setSessionCookie } from "@/lib/auth";
import { dbCreateUserWithPassword } from "@/lib/db-file";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const VALID_GRADES = [6, 7, 8, 9, 10, 11, 12];
const VALID_MAJORS = ["عمومی", "ریاضی", "تجربی", "انسانی", "فنی", "هنر"];

const Body = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(200),
  password: z.string().min(8).max(100),
  grade: z.number().int().refine(g => VALID_GRADES.includes(g), { message: "پایهٔ نامعتبر" }),
  major: z.string().refine(m => VALID_MAJORS.includes(m), { message: "رشتهٔ نامعتبر" }),
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: "تعداد تلاش زیاد." }, { status: 429 });

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر." }, { status: 400 });
    }

    const user = await dbCreateUserWithPassword({
      name: parsed.data.name.trim(),
      email: parsed.data.email.trim(),
      password: parsed.data.password,
      grade: parsed.data.grade,
      major: parsed.data.major,
    });

    const token = await signSession({ userId: user.id, role: user.role, name: user.name }, true);
    await setSessionCookie(token, true);

    return NextResponse.json({ ok: true, role: user.role, name: user.name });
  } catch (e: any) {
    if (e instanceof Error && e.message === "duplicate-email") {
      return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده." }, { status: 409 });
    }
    console.error("[auth/register] EXCEPTION:", e);
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}