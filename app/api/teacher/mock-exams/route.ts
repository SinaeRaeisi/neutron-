import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { dbListCustomMockExams, dbListUsers, dbListUserMockAttempts } from "@/lib/db-file";
import { courses } from "@/lib/data";

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s || (s.role !== "teacher" && s.role !== "admin")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const myCourseIds = courses
    .filter(c => c.teacherId === s.userId || (c.availableTeachers ?? []).includes(s.userId))
    .map(c => c.id);

  const mySubjects = new Set(
    courses.filter(c => myCourseIds.includes(c.id)).map(c => c.subject)
  );

  const allExams = await dbListCustomMockExams();
  const exams = allExams.filter((m: any) =>
    m.subjects?.some((sub: string) => mySubjects.has(sub)) || myCourseIds.length > 0
  );

  const allUsers = await dbListUsers();
  
  // استفاده از Promise.all برای حل مشکل async در map
  const result = await Promise.all(exams.map(async (m: any) => {
    const rows: { userId: string; name: string; best: number; attempts: number }[] = [];
    
    for (const u of allUsers) {
      const userAttempts = await dbListUserMockAttempts(u.id);
      const attempts = userAttempts.filter((a: any) => a.examId === m.id);
      
      if (attempts.length === 0) continue;
      const best = attempts.reduce((mx: number, a: any) => Math.max(mx, a.score), 0);
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
  }));

  return NextResponse.json({ data: result });
}