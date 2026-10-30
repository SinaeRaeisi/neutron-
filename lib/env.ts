const REQUIRED_ALL = ["JWT_SECRET"] as const;
const REQUIRED_PROD = ["DATABASE_URL"] as const;

function fail(msg: string): never {
  console.error(`[env] ${msg}`);
  throw new Error(`Environment misconfigured: ${msg}`);
}

function checkOne(key: string, required: boolean): string | undefined {
  const v = process.env[key];
  if (!v) {
    if (required) fail(`Missing required env var: ${key}`);
    return undefined;
  }
  if (key === "JWT_SECRET" && v.length < 32) {
    fail(`JWT_SECRET must be at least 32 characters (got ${v.length}).`);
  }
  if (key === "JWT_SECRET" && v === "dev-secret") {
    fail(`JWT_SECRET must not be the placeholder value. Generate a real one.`);
  }
  return v;
}

const isProd = process.env.NODE_ENV === "production";
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";

for (const k of REQUIRED_ALL) checkOne(k, true);
if (isProd && !isBuildPhase) for (const k of REQUIRED_PROD) checkOne(k, true);

export const env = {
  JWT_SECRET: checkOne("JWT_SECRET", true)!,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  isProd,
} as const;