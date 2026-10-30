import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { dbListCustomMockExams, dbListUsers, dbListUserMockAttempts } from "@/lib/db-file";
import { courses } from "@/lib/data";

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (s.role !== "teacher" && s.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // دوره‌های معلم
  const myCourseIds = courses
    .filter(c => c.teacherId === s.userId || (c.availableTeachers ?? []).includes(s.userId))
    .map(c => c.id);

  // فقط آزمون‌هایی که subject با دوره‌های معلم همپوشانی دارد
  const mySubjects = new Set(
    courses
      .filter(c => myCourseIds.includes(c.id))
      .map(c => c.subject)
  );

  const exams = dbListCustomMockExams().filter((m: any) =>
    m.subjects?.some((s: string) => mySubjects.has(s)) ||
    myCourseIds.length > 0
  );

  // برای هر آزمون، رتبه‌بندی
  const allUsers = dbListUsers();
  const result = exams.map((m: any) => {
    const rows: { userId: string; name: string; best: number; attempts: number }[] = [];
    for (const u of allUsers) {
      const attempts = dbListUserMockAttempts(u.id).filter(a => a.examId === m.id);
      if (attempts.length === 0) continue;
      const best = attempts.reduce((mx, a) => Math.max(mx, a.score), 0);
      rows.push({ userId: u.id, name: u.name, best, attempts: attempts.length });
    }
    rows.sort((a, b) => b.best - a.best);

    return {
      exam: {
        id: m.id,
        title: m.title,
        grade: m.grade,
        major: m.major,
        scheduledAt: m.scheduledAt,
        questionCount: m.questionCount ?? m.questions?.length ?? 0,
      },
      totalParticipants: rows.length,
      top: rows.slice(0, 10),
    };
  });

  return NextResponse.json({ data: result });
}