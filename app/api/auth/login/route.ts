import { NextResponse } from "next/server";
import { z } from "zod";
import { signSession, setSessionCookie } from "@/lib/auth";
import { dbVerifyUserPassword } from "@/lib/db-file";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: "تعداد تلاش زیاد." }, { status: 429 });

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });

    const user = await dbVerifyUserPassword(parsed.data.email, parsed.data.password);
    if (!user) {
      return NextResponse.json({ error: "ایمیل یا رمز عبور اشتباه است." }, { status: 401 });
    }

    const token = await signSession({ userId: user.id, role: user.role, name: user.name }, true);
    await setSessionCookie(token, true);

    return NextResponse.json({ ok: true, role: user.role, name: user.name });
  } catch (e) {
    console.error("[login] EXCEPTION:", e);
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}