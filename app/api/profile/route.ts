import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbUpdateUser, dbGetUserById } from "@/lib/db-file";
import type { Grade, Major } from "@/lib/types";

const VALID_GRADES = [6, 7, 8, 9, 10, 11, 12];
const VALID_MAJORS: Major[] = ["عمومی", "ریاضی", "تجربی", "انسانی", "فنی", "هنر"];

const Body = z.object({
  name: z.string().min(2).max(80).optional(),
  grade: z.number().int().optional(),
  major: z.string().optional(),
});

export async function PATCH(req: Request) {
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

  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name.trim();
  if (parsed.data.grade !== undefined) {
    if (!VALID_GRADES.includes(parsed.data.grade)) {
      return NextResponse.json({ error: "پایهٔ نامعتبر." }, { status: 400 });
    }
    patch.grade = parsed.data.grade as Grade;
  }
  if (parsed.data.major !== undefined) {
    if (!VALID_MAJORS.includes(parsed.data.major as Major)) {
      return NextResponse.json({ error: "رشتهٔ نامعتبر." }, { status: 400 });
    }
    patch.major = parsed.data.major as Major;
  }

  const updated = await dbUpdateUser(s.userId, patch);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, user: updated });
}

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const user = await dbGetUserById(s.userId);
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(user);
}