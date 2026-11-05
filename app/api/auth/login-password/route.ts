import { NextResponse } from "next/server";
import { z } from "zod";
import { signSession, setSessionCookie } from "@/lib/auth";
import { dbGetUserByEmail } from "@/lib/db-file";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`login-pass:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ error: "تلاش زیاد. کمی بعد." }, { status: 429 });
    }

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });
    }

    const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
    const adminPass = (process.env.ADMIN_PASSWORD ?? "").trim();

    // 🔍 تشخیص دقیق
    if (!adminEmail || !adminPass) {
      console.error("[login-password] env missing", {
        hasEmail: !!adminEmail,
        hasPass: !!adminPass,
      });
      return NextResponse.json(
        { error: "سرور پیکربندی نشده: ADMIN_EMAIL یا ADMIN_PASSWORD در .env.local نیست." },
        { status: 500 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    console.log("[login-password] try:", {
      email,
      passwordLen: password.length,
      envEmail: adminEmail,
      envPassLen: adminPass.length,
    });

    if (email !== adminEmail) {
      return NextResponse.json({ error: "ایمیل یا رمز اشتباه است." }, { status: 401 });
    }
    if (password !== adminPass) {
      console.error("[login-password] password mismatch:", {
        got: password.length,
        expected: adminPass.length,
      });
      return NextResponse.json({ error: "ایمیل یا رمز اشتباه است." }, { status: 401 });
    }

    const admin = await dbGetUserByEmail(adminEmail);
    if (!admin) {
      console.error("[login-password] admin user not in DB for email:", adminEmail);
      return NextResponse.json(
        { error: "کاربر مدیر در پایگاه‌داده نیست. لطفاً .data/db.json را پاک کن و سرور را ری‌استارت کن." },
        { status: 404 }
      );
    }
    if (admin.role !== "admin") {
      console.error("[login-password] user exists but role:", admin.role);
      return NextResponse.json({ error: "این کاربر نقش مدیر ندارد." }, { status: 403 });
    }

    const token = await signSession({ userId: admin.id, role: "admin", name: admin.name }, true);
    await setSessionCookie(token, true);
    console.log(`[login-password] ✓ ${admin.email} وارد شد`);
    return NextResponse.json({ ok: true, role: "admin", name: admin.name });
  } catch (e: any) {
    console.error("[login-password] EXCEPTION:", e);
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}