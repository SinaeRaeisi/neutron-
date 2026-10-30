import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { dbGetLiveClassById, dbGetChatState, dbSetChatState } from "@/lib/db-file";

const Body = z.object({
  chatMode: z.enum(["public", "private"]).optional(),
  chatLocked: z.boolean().optional(),
  banUser: z.string().optional(),
  unbanUser: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { liveId: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const live = dbGetLiveClassById(params.liveId);
  if (!live) return NextResponse.json({ error: "کلاس یافت نشد." }, { status: 404 });

  if (s.role !== "admin" && live.teacherId !== s.userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "اطلاعات نامعتبر." }, { status: 400 });
  }

  const current = dbGetChatState(params.liveId);
  const banned = new Set(current.bannedFromChat ?? []);

  if (parsed.data.banUser) banned.add(parsed.data.banUser);
  if (parsed.data.unbanUser) banned.delete(parsed.data.unbanUser);

  const patch: {
    chatMode?: "public" | "private";
    chatLocked?: boolean;
    bannedFromChat?: string[];
  } = {};

  if (parsed.data.chatMode !== undefined) patch.chatMode = parsed.data.chatMode;
  if (parsed.data.chatLocked !== undefined) patch.chatLocked = parsed.data.chatLocked;
  if (parsed.data.banUser || parsed.data.unbanUser) patch.bannedFromChat = [...banned];

  const state = dbSetChatState(params.liveId, patch);
  return NextResponse.json({
    ok: true,
    state: {
      chatMode: state.chatMode,
      chatLocked: state.chatLocked,
      bannedFromChat: state.bannedFromChat ?? [],
    },
  });
}