import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { dbListUsers, dbListCustomLiveClasses, dbListCustomQuizzes, dbListCustomMockExams, dbListPendingPayments, dbListAllTickets } from "@/lib/db-file";

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s || s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const users = await dbListUsers();
  const live = await dbListCustomLiveClasses();
  const quizzes = await dbListCustomQuizzes();
  const mocks = await dbListCustomMockExams();
  const payments = await dbListPendingPayments();
  const tickets = await dbListAllTickets();

  return NextResponse.json({
    users: {
      total: users.length,
      students: users.filter((u: any) => u.role === "student").length,
      teachers: users.filter((u: any) => u.role === "teacher").length,
      admins: users.filter((u: any) => u.role === "admin").length,
    },
    liveClasses: live.length,
    quizzes: quizzes.length,
    mockExams: mocks.length,
    tickets: tickets.length,
    activeSubs: payments.filter((p: any) => p.status === 'approved').length,
  });
}