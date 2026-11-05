import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import {
  dbCreateCustomLiveClass, dbListCustomLiveClasses, dbBroadcastToStudents,
} from "@/lib/db-file";
import { getCourse } from "@/lib/data";

const Body = z.object({
  title: z.string().min(3).max(120),
  courseId: z.string().min(1),
  scheduledAt: z.string().min(10),
  durationMin: z.number().int().min(15).max(240),
  capacity: z.number().int().min(1).max(10000),
  description: z.string().max(500).optional().default(""),
  requiredQuizId: z.string().optional(),
  notes: z.string().max(5000).optional().default(""),
  attachments: z.array(z.object({
    id: z.string(), name: z.string(), url: z.string(),
    size: z.number(), type: z.string(),
  })).optional().default([]),
});

export async function GET() {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ classes: [] });
  try {
    const s = await verifySession(token);
    if (!s) return NextResponse.json({ classes: [] });
    const all = await dbListCustomLiveClasses();
    if (s.role === "teacher") {
      return NextResponse.json({ classes: all.filter(c => c.teacherId === s.userId) });
    }
    return NextResponse.json({ classes: all });
  } catch {
    return NextResponse.json({ classes: [] });
  }
}

export async function POST(req: Request) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (s.role !== "teacher" && s.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: `اطلاعات نامعتبر: ${issue?.path.join(".")} — ${issue?.message}` },
      { status: 400 }
    );
  }

  const live = await dbCreateCustomLiveClass({
    id: "lv-" + Math.random().toString(36).slice(2, 8),
    title: parsed.data.title,
    courseId: parsed.data.courseId,
    teacherId: s.userId,
    scheduledAt: parsed.data.scheduledAt,
    durationMin: parsed.data.durationMin,
    capacity: parsed.data.capacity,
    enrolled: 0,
    status: "upcoming",
    description: parsed.data.description,
    requiredQuizId: parsed.data.requiredQuizId || undefined,
    notes: parsed.data.notes,
    attachments: parsed.data.attachments,
  });

  const course = getCourse(parsed.data.courseId);
  if (course) {
    const dt = new Date(parsed.data.scheduledAt);
    const dateStr = dt.toLocaleDateString("fa-IR", {
      timeZone: "Asia/Tehran", month: "long", day: "numeric",
    });
    const timeStr = dt.toLocaleTimeString("fa-IR", {
      timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit",
    });
    dbBroadcastToStudents(
      { grade: course.grade, major: course.major },
      {
        title: "کلاس زندهٔ جدید",
        body: `${parsed.data.title} — ${dateStr} ساعت ${timeStr}`,
        href: `/app/live/${live.id}`,
      }
    );
  }

  return NextResponse.json({ ok: true, live });
}