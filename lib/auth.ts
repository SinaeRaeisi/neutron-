import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";
import type { Role } from "./types";

const secret = new TextEncoder().encode(env.JWT_SECRET);
const COOKIE = "n_session";
const PENDING_COOKIE = "n_pending";

const SHORT_TTL = 24 * 60 * 60;          // ۱ روز
const LONG_TTL = 90 * 24 * 60 * 60;      // ۹۰ روز (auto-login)
const PENDING_TTL = 60 * 10;             // ۱۰ دقیقه

export interface SessionPayload {
  userId: string;
  role: Role;
  name: string;
}

export async function signSession(
  p: SessionPayload,
  remember: boolean = true
): Promise<string> {
  const ttl = remember ? LONG_TTL : SHORT_TTL;
  return new SignJWT({ role: p.role, name: p.name, remember })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.userId)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.role !== "string" || typeof payload.name !== "string") {
      return null;
    }
    return {
      userId: payload.sub,
      role: payload.role as Role,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string, remember: boolean = true): Promise<void> {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    maxAge: remember ? LONG_TTL : SHORT_TTL,
  });
}

export function clearSessionCookie(): void {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(roles?: Role[]): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Response("Unauthorized", { status: 401 });
  if (roles && !roles.includes(s.role)) throw new Response("Forbidden", { status: 403 });
  return s;
}

// ─── Pending (پس از OTP، قبل از ثبت‌نام) ───
export async function signPending(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_TTL}s`)
    .sign(secret);
}

export async function verifyPending(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.email !== "string") return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export function setPendingCookie(token: string): void {
  cookies().set(PENDING_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: env.isProd,
    path: "/", maxAge: PENDING_TTL,
  });
}

export function clearPendingCookie(): void {
  cookies().delete(PENDING_COOKIE);
}