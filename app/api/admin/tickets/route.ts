import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import fs from "fs";
import path from "path";
import type { SupportTicket } from "@/lib/types";

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const db = JSON.parse(raw);
    const all: SupportTicket[] = Array.isArray(db.tickets) ? db.tickets : [];
    // جدیدترین اول
    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return NextResponse.json({ tickets: all });
  } catch {
    return NextResponse.json({ tickets: [] });
  }
}