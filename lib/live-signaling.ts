export type PeerRole = "host" | "viewer";
export type SignalType = "offer" | "answer" | "ice" | "leave" | "ready" | "kicked";

export interface SignalMessage {
  id: string;
  from: string;
  type: SignalType;
  payload: unknown;
  createdAt: number;
}

interface Peer {
  id: string;
  role: PeerRole;
  userId: string;
  userName: string;
  lastSeen: number;
  messages: SignalMessage[];
}

interface Room {
  peers: Map<string, Peer>;
}

const globalForSig = globalThis as unknown as {
  __neutronSigRooms?: Map<string, Room>;
};
const rooms = globalForSig.__neutronSigRooms ?? new Map<string, Room>();
globalForSig.__neutronSigRooms = rooms;

const PEER_TIMEOUT = 30_000;
const MAX_QUEUED = 200;

function getRoom(liveId: string): Room {
  let r = rooms.get(liveId);
  if (!r) {
    r = { peers: new Map() };
    rooms.set(liveId, r);
  }
  return r;
}

function cleanStale(room: Room) {
  const now = Date.now();
  for (const [id, p] of room.peers) {
    if (now - p.lastSeen > PEER_TIMEOUT) room.peers.delete(id);
  }
}

function genId() {
  return "p-" + Math.random().toString(36).slice(2, 10);
}

export function registerPeer(input: {
  liveId: string;
  userId: string;
  userName: string;
  role: PeerRole;
}): string {
  const room = getRoom(input.liveId);
  cleanStale(room);

  const baseId = `${input.userId}:${input.role}`;
  const existing = room.peers.get(baseId);
  if (existing) {
    existing.lastSeen = Date.now();
    existing.userName = input.userName;
    return baseId;
  }

  if (input.role === "host") {
    for (const [id, p] of room.peers) {
      if (p.role === "host") room.peers.delete(id);
    }
  }

  room.peers.set(baseId, {
    id: baseId,
    role: input.role,
    userId: input.userId,
    userName: input.userName,
    lastSeen: Date.now(),
    messages: [],
  });
  return baseId;
}

export function heartbeat(liveId: string, peerId: string) {
  const room = getRoom(liveId);
  const p = room.peers.get(peerId);
  if (p) p.lastSeen = Date.now();
}

export function sendSignal(input: {
  liveId: string;
  from: string;
  to: string;
  type: SignalType;
  payload: unknown;
}): number {
  const room = getRoom(input.liveId);
  cleanStale(room);
  const now = Date.now();

  const targets =
    input.to === "*"
      ? [...room.peers.values()].filter(p => p.id !== input.from)
      : [room.peers.get(input.to)].filter(Boolean) as Peer[];

  let sent = 0;
  for (const t of targets) {
    if (!t) continue;
    t.messages.push({
      id: genId(),
      from: input.from,
      type: input.type,
      payload: input.payload,
      createdAt: now,
    });
    if (t.messages.length > MAX_QUEUED) {
      t.messages = t.messages.slice(-MAX_QUEUED);
    }
    sent++;
  }
  return sent;
}

export function drainMessages(liveId: string, peerId: string): {
  messages: SignalMessage[];
  peers: { id: string; role: PeerRole; userName: string; userId: string }[];
  hostOnline: boolean;
} {
  const room = getRoom(liveId);
  cleanStale(room);

  const me = room.peers.get(peerId);
  if (!me) {
    return { messages: [], peers: [], hostOnline: false };
  }
  me.lastSeen = Date.now();

  const msgs = me.messages;
  me.messages = [];

  const peers = [...room.peers.values()]
    .filter(p => p.id !== peerId)
    .map(p => ({ id: p.id, role: p.role, userName: p.userName, userId: p.userId }));

  const hostOnline = [...room.peers.values()].some(p => p.role === "host");

  return { messages: msgs, peers, hostOnline };
}

export function leavePeer(liveId: string, peerId: string) {
  const room = getRoom(liveId);
  room.peers.delete(peerId);
  for (const p of room.peers.values()) {
    p.messages.push({
      id: genId(),
      from: peerId,
      type: "leave",
      payload: null,
      createdAt: Date.now(),
    });
  }
}

export function kickPeer(liveId: string, targetUserId: string): {
  peerId: string | null;
  userName: string | null;
} {
  const room = getRoom(liveId);
  const target = [...room.peers.values()].find(p => p.userId === targetUserId);
  if (!target) return { peerId: null, userName: null };

  target.messages.push({
    id: genId(),
    from: "system",
    type: "kicked",
    payload: null,
    createdAt: Date.now(),
  });

  setTimeout(() => room.peers.delete(target.id), 2000);

  return { peerId: target.id, userName: target.userName };
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    for (const [, room] of rooms) cleanStale(room);
  }, 60_000).unref?.();
}