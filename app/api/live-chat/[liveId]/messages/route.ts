import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbCreateChatMessage, dbGetChatState, dbGetLiveClassById } from "@/lib/db-file";

const Body = z.object({
  text: z.string().min(1).max(1000),
});

export async function POST(req: Request, { params }: { params: { liveId: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const live = await dbGetLiveClassById(params.liveId);
  if (!live) return NextResponse.json({ error: "کلاس یافت نشد." }, { status: 404 });

  const now = Date.now();
  const startMs = new Date(live.scheduledAt).getTime();
  const endMs = startMs + live.durationMin * 60 * 1000;
  if (s.role === "student" && (now < startMs || now > endMs)) {
    return NextResponse.json({ error: "کلاس در حال برگزاری نیست." }, { status: 403 });
  }

  const state = await dbGetChatState(params.liveId);

  if (state.bannedFromChat?.includes(s.userId)) {
    return NextResponse.json(
      { error: "شما از چت مسدود شده‌اید.", code: "banned_from_chat" },
      { status: 403 }
    );
  }

  if (s.role === "student" && state.chatLocked) {
    return NextResponse.json(
      { error: "چت توسط معلم قفل شده است.", code: "chat_locked" },
      { status: 403 }
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "پیام نامعتبر." }, { status: 400 });
  }

  const msg = await dbCreateChatMessage({
    liveId: params.liveId,
    userId: s.userId,
    userName: s.name,
    userRole: s.role as "student" | "teacher" | "admin",
    text: parsed.data.text.trim(),
  });

  return NextResponse.json({ ok: true, message: msg });
}