import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbListUserTickets, dbCreateTicket } from "@/lib/db-file";

const Body = z.object({
  subject: z.string().min(3).max(150),
  category: z.string().min(1),
  text: z.string().min(5).max(2000),
});

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ tickets: dbListUserTickets(s.userId) });
}

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });

  const ticket = await dbCreateTicket({
    userId: s.userId,
    userName: s.name,
    subject: parsed.data.subject,
    category: parsed.data.category,
    text: parsed.data.text,
  });
  return NextResponse.json({ ok: true, ticket });
}