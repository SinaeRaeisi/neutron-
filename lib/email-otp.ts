interface Entry {
  code: string;
  expiresAt: number;
  attempts: number;
  requestedAt: number;
}

const globalForOtp = globalThis as unknown as {
  __neutronEmailOtp?: Map<string, Entry>;
};
const store = globalForOtp.__neutronEmailOtp ?? new Map<string, Entry>();
globalForOtp.__neutronEmailOtp = store;

const TTL_MS = 2 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = process.env.NODE_ENV === "production" ? 60_000 : 10_000;

export function normalizeEmail(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t;
}

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export interface RequestResult {
  ok: boolean;
  reason?: "cooldown" | "invalid_email";
  cooldownLeftSec?: number;
  code?: string;
}

export function requestEmailOtp(rawEmail: string): RequestResult {
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false, reason: "invalid_email" };

  const now = Date.now();
  const existing = store.get(email);

  if (existing && now - existing.requestedAt < RESEND_COOLDOWN_MS) {
    const left = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.requestedAt)) / 1000);
    return { ok: false, reason: "cooldown", cooldownLeftSec: left };
  }

  const code = genCode();
  store.set(email, {
    code,
    expiresAt: now + TTL_MS,
    attempts: 0,
    requestedAt: now,
  });
  return { ok: true, code };
}

export interface VerifyResult {
  ok: boolean;
  reason?: "no_code" | "expired" | "wrong" | "too_many_attempts";
  attemptsLeft?: number;
}

export function verifyEmailOtp(rawEmail: string, inputCode: string): VerifyResult {
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false, reason: "no_code" };

  const entry = store.get(email);
  if (!entry) return { ok: false, reason: "no_code" };

  if (Date.now() > entry.expiresAt) {
    store.delete(email);
    return { ok: false, reason: "expired" };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(email);
    return { ok: false, reason: "too_many_attempts" };
  }
  if (entry.code !== inputCode.trim()) {
    entry.attempts++;
    const left = MAX_ATTEMPTS - entry.attempts;
    if (left === 0) store.delete(email);
    return { ok: false, reason: "wrong", attemptsLeft: left };
  }
  store.delete(email);
  return { ok: true };
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) if (v.expiresAt < now) store.delete(k);
  }, 60_000).unref?.();
}