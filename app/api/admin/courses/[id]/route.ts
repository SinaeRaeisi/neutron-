import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import {
  dbGetCustomCourse, dbUpdateCustomCourse, dbDeleteCustomCourse,
  dbSetCourseOverride, dbMarkCourseDeleted,
} from "@/lib/db-file";
import { getCourseById, isSeedCourse } from "@/lib/content";

async function authAdmin() {
  const token = cookies().get("n_session")?.value;
  if (!token) return null;
  const s = await verifySession(token);
  return s?.role === "admin" ? s : null;
}

const Body = z.object({
  title: z.string().min(3).max(150).optional(),
  subject: z.string().min(2).max(40).optional(),
  grade: z.number().int().min(6).max(12).optional(),
  major: z.string().min(2).optional(),
  teacherId: z.string().min(1).optional(),
  summary: z.string().min(5).max(500).optional(),
  level: z.enum(["پایه", "متوسط", "پیشرفته"]).optional(),
  cover: z.enum(["lime", "sky", "violet", "amber", "rose"]).optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const s = await authAdmin();
  if (!s) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const existing = getCourseById(params.id);
  if (!existing) return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: `اطلاعات نامعتبر: ${parsed.error.issues[0]?.message}` },
      { status: 400 }
    );
  }

  if (isSeedCourse(params.id)) {
    dbSetCourseOverride(params.id, parsed.data as any);
    return NextResponse.json({ ok: true, course: getCourseById(params.id) });
  }

  const custom = dbGetCustomCourse(params.id);
  if (custom) {
    dbUpdateCustomCourse(custom.id, parsed.data as any);
    return NextResponse.json({ ok: true, course: getCourseById(params.id) });
  }

  return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const s = await authAdmin();
  if (!s) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const existing = getCourseById(params.id);
  if (!existing) return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });

  if (isSeedCourse(params.id)) {
    dbMarkCourseDeleted(params.id);
    return NextResponse.json({ ok: true, softDeleted: true });
  }

  const custom = dbGetCustomCourse(params.id);
  if (custom) {
    dbDeleteCustomCourse(custom.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
}