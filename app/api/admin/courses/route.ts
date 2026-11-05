import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbCreateCustomCourse } from "@/lib/db-file";
import { getAllCourses, isSeedCourse } from "@/lib/content";

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s || s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const allCourses = await getAllCourses();
  const courses = allCourses.map((c: any) => ({
    ...c,
    isSeed: isSeedCourse(c.id),
  }));
  return NextResponse.json({ courses });
}

const Body = z.object({
  title: z.string().min(3).max(150),
  subject: z.string().min(2).max(40),
  grade: z.number().int().min(6).max(12),
  major: z.string().min(2),
  teacherId: z.string().min(1),
  summary: z.string().min(5).max(500),
  level: z.enum(["پایه", "متوسط", "پیشرفته"]),
  cover: z.enum(["lime", "sky", "violet", "amber", "rose"]),
});

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s || s.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: `اطلاعات نامعتبر: ${parsed.error.issues[0]?.message}` },
      { status: 400 }
    );
  }

  const c = await dbCreateCustomCourse({
    id: "cc-" + Math.random().toString(36).slice(2, 8),
    title: parsed.data.title,
    subject: parsed.data.subject,
    grade: parsed.data.grade,
    major: parsed.data.major,
    teacherId: parsed.data.teacherId,
    conceptIds: [],
    lessons: [],
    summary: parsed.data.summary,
    level: parsed.data.level,
    cover: parsed.data.cover,
  });
  return NextResponse.json({ ok: true, course: c });
}