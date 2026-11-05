import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { dbMarkAllNotificationsRead } from "@/lib/db-file";

export async function PATCH() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const count = await dbMarkAllNotificationsRead(s.userId);
  return NextResponse.json({ ok: true, count, unread: 0 });
}