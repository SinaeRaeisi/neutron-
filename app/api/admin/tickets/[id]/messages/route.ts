import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbAddTicketMessage } from "@/lib/db-file";

const Body = z.object({
  text: z.string().min(1).max(2000),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "پیام نامعتبر." }, { status: 400 });

  const ticket = dbAddTicketMessage({
    ticketId: params.id,
    authorId: s.userId,
    authorRole: "admin",
    authorName: s.name,
    text: parsed.data.text,
  });
  if (!ticket) return NextResponse.json({ error: "تیکت پیدا نشد." }, { status: 404 });
  return NextResponse.json({ ok: true, ticket });
}