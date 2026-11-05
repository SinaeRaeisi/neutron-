import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbListUsers, dbGetUserByEmail } from "@/lib/db-file";
import { prisma } from "@/lib/db-file";
import bcrypt from "bcryptjs";

const Body = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["student", "teacher", "admin"]),
});

export async function GET() {
  const token = cookies().get("n_session")?.value;
  const s = token ? await verifySession(token) : null;
  if (!s || s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const users = await dbListUsers();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  const s = token ? await verifySession(token) : null;
  if (!s || s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر است." }, { status: 400 });

  const existing = await dbGetUserByEmail(parsed.data.email);
  if (existing) return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده." }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      passwordHash,
    }
  });

  return NextResponse.json({ ok: true });
}