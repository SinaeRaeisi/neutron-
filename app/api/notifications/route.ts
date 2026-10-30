import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { dbListUserNotifications, dbUnreadCount } from "@/lib/db-file";

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ notifications: [], unread: 0 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ notifications: [], unread: 0 });

  return NextResponse.json({
    notifications: dbListUserNotifications(s.userId, 30),
    unread: dbUnreadCount(s.userId),
  });
}