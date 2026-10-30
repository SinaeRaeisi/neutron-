import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import {
  dbListUsers, dbListCustomLiveClasses, dbListCustomQuizzes,
  dbListCustomMockExams,
} from "@/lib/db-file";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const users = dbListUsers();
  const live = dbListCustomLiveClasses();
  const quizzes = dbListCustomQuizzes();
  const mocks = dbListCustomMockExams();

  let tickets = 0;
  let subs = 0;
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const db = JSON.parse(raw);
    tickets = (db.tickets ?? []).length;
    subs = (db.subscriptions ?? []).filter((x: any) => x.status === "active").length;
  } catch { /* noop */ }

  return NextResponse.json({
    users: {
      total: users.length,
      students: users.filter(u => u.role === "student").length,
      teachers: users.filter(u => u.role === "teacher").length,
      admins: users.filter(u => u.role === "admin").length,
    },
    liveClasses: live.length,
    quizzes: quizzes.length,
    mockExams: mocks.length,
    tickets,
    activeSubs: subs,
  });
}