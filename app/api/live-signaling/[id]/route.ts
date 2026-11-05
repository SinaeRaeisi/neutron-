import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import {
  registerPeer, heartbeat, sendSignal, drainMessages, leavePeer, kickPeer,
  type PeerRole, type SignalType,
} from "@/lib/live-signaling";
import {
  dbGetLiveClassById, dbGetActiveSubscription, dbGetChatState, dbSetChatState,
} from "@/lib/db-file";

const RegisterBody = z.object({
  action: z.literal("register"),
  role: z.enum(["host", "viewer"]),
});

const SendBody = z.object({
  action: z.literal("send"),
  peerId: z.string().min(1),
  to: z.string().min(1),
  type: z.enum(["offer", "answer", "ice", "leave", "ready", "kicked"]),
  payload: z.unknown(),
});

const HeartbeatBody = z.object({
  action: z.literal("heartbeat"),
  peerId: z.string().min(1),
});

const LeaveBody = z.object({
  action: z.literal("leave"),
  peerId: z.string().min(1),
});

const KickBody = z.object({
  action: z.literal("kick"),
  userId: z.string().min(1),
});

const Body = z.discriminatedUnion("action", [
  RegisterBody, SendBody, HeartbeatBody, LeaveBody, KickBody,
]);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await verifySession(token);
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const live = await dbGetLiveClassById(params.id);
  if (!live) return NextResponse.json({ error: "کلاس یافت نشد." }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });
  }

  // register
  if (parsed.data.action === "register") {
    const role = parsed.data.role;

    if (role === "host") {
      if (s.role !== "admin" && live.teacherId !== s.userId) {
        return NextResponse.json({ error: "فقط معلم می‌تواند پخش کند." }, { status: 403 });
      }
    } else {
      const state = await dbGetChatState(params.id);
      if (state.kickedFromLive?.includes(s.userId)) {
        return NextResponse.json(
          { error: "شما از این کلاس اخراج شده‌اید. با معلم تماس بگیر." },
          { status: 403 }
        );
      }

      if (s.role === "student") {
        const sub = await dbGetActiveSubscription(s.userId);
        if (!sub) {
          return NextResponse.json({ error: "اشتراک فعال لازم است." }, { status: 403 });
        }
        const now = Date.now();
        const startMs = new Date(live.scheduledAt).getTime();
        const endMs = startMs + live.durationMin * 60 * 1000;
        if (now < startMs || now > endMs) {
          return NextResponse.json({ error: "کلاس در حال برگزاری نیست." }, { status: 403 });
        }
      }
    }

    const peerId = registerPeer({
      liveId: params.id,
      userId: s.userId,
      userName: s.name,
      role: role as PeerRole,
    });
    return NextResponse.json({ ok: true, peerId, role });
  }

  // send
  if (parsed.data.action === "send") {
    sendSignal({
      liveId: params.id,
      from: parsed.data.peerId,
      to: parsed.data.to,
      type: parsed.data.type as SignalType,
      payload: parsed.data.payload,
    });
    return NextResponse.json({ ok: true });
  }

  // heartbeat
  if (parsed.data.action === "heartbeat") {
    heartbeat(params.id, parsed.data.peerId);
    return NextResponse.json({ ok: true });
  }

  // leave
  if (parsed.data.action === "leave") {
    leavePeer(params.id, parsed.data.peerId);
    return NextResponse.json({ ok: true });
  }

  // kick
  if (parsed.data.action === "kick") {
    if (s.role !== "admin" && live.teacherId !== s.userId) {
      return NextResponse.json({ error: "فقط معلم می‌تواند اخراج کند." }, { status: 403 });
    }
    kickPeer(params.id, parsed.data.userId);

    const state = await dbGetChatState(params.id);
    const kicked = new Set(state.kickedFromLive ?? []);
    kicked.add(parsed.data.userId);
    dbSetChatState(params.id, { kickedFromLive: [...kicked] });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "نامعلوم" }, { status: 400 });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get("n_session")?.value;
  if (!token) return NextResponse.json({ messages: [], peers: [], hostOnline: false });

  const s = await verifySession(token);
  if (!s) return NextResponse.json({ messages: [], peers: [], hostOnline: false });

  const url = new URL(req.url);
  const peerId = url.searchParams.get("peerId") ?? "";
  if (!peerId) return NextResponse.json({ messages: [], peers: [], hostOnline: false });

  return NextResponse.json(drainMessages(params.id, peerId));
}