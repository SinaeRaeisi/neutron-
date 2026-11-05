import { NextResponse } from "next/server";
import { z } from "zod";
import { dbCreateContact } from "@/lib/db-file";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const Body = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional().or(z.literal("")).transform(v => v || undefined),
  message: z.string().max(1000).optional().or(z.literal("")).transform(v => v || undefined),
  grade: z.number().int().optional(),
  major: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`contact:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "تعداد درخواست زیاد." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });
  }

  const c = await dbCreateContact(parsed.data);
  console.log(`[contact] ${c.name} — ${c.phone}`);
  return NextResponse.json({ ok: true, id: c.id });
}