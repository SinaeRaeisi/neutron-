import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { dbListUsers } from "@/lib/db-file";

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s || s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const users = await dbListUsers(); // ← اینجا await اضافه شد
  const result = users.map((u: any) => ({
    id: u.id, name: u.name, phone: u.phone, role: u.role,
    grade: u.grade, major: u.major,
  }));
  
  return NextResponse.json({ users: result });
}