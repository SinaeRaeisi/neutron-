import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { dbGetUserById, dbGetActiveSubscription } from "@/lib/db-file";

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await dbGetUserById(s.userId);
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  const subscription = await dbGetActiveSubscription(user.id);

  return NextResponse.json({
    id: user.id,
    name: user.name,
    role: user.role,
    phone: user.phone,
    grade: user.grade,
    major: user.major,
    subscription,
  });
}