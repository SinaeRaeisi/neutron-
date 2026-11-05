import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { dbGetChatState, dbListChatMessages } from "@/lib/db-file";

export async function GET(_: Request, { params }: { params: { liveId: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) {
    return NextResponse.json({
      state: { chatMode: "public", chatLocked: false, bannedFromChat: [] },
      messages: [],
      me: null,
    });
  }
  const s = await verifySession(token);
  if (!s) {
    return NextResponse.json({
      state: { chatMode: "public", chatLocked: false, bannedFromChat: [] },
      messages: [],
      me: null,
    });
  }

  const state = await dbGetChatState(params.liveId);
  const messages = await dbListChatMessages(
    params.liveId,
    s.userId,
    s.role as "student" | "teacher" | "admin"
  );

  const isStaff = s.role === "teacher" || s.role === "admin";

  return NextResponse.json({
    state: {
      chatMode: state.chatMode,
      chatLocked: state.chatLocked,
      bannedFromChat: isStaff ? (state.bannedFromChat ?? []) : undefined,
      kickedFromLive: isStaff ? (state.kickedFromLive ?? []) : undefined,
    },
    messages,
    me: { id: s.userId, name: s.name, role: s.role },
  });
}