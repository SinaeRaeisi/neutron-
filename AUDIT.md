# NEUTRON — Security & Quality Audit

**Date:** 2026-10-29
**Auditor:** Engineering (code inspection, no live execution)
**Scope:** Existing codebase at C:\Users\Sina\Desktop\Neutron
**Method:** Manual code review against known-good patterns. Items marked
"Verified" are confirmed by reading the source. Items marked "Unverified"
require running the app or tools to confirm.

---

## Executive summary

The application is a functional single-user demo with three roles and a
knowledge graph. It is **not production-ready**: authentication is
placeholder, data is per-browser (localStorage), authorization is enforced
only in middleware, and Next.js/postcss have known CVEs.

The highest-value path to production is:
1. Real authentication (this commit).
2. Server-side authorization on every mutation (this commit).
3. Env validation fail-fast (this commit).
4. Migrate data to Prisma + Postgres (next).
5. Upgrade to Next 16 (before public deploy).

---

## Confirmed defects (verified by code inspection)

### Critical — security

- **C1. Authentication bypass.** `/api/auth` accepts `{ userId }` and issues a
  JWT with no password check. Any client can authenticate as any user,
  including `u3` (admin). Demonstrated by reading `app/api/auth/route.ts`.
- **C2. JWT secret fallback.** `lib/...` and `middleware.ts` fall back to
  `"dev-secret"` when `JWT_SECRET` is missing. If env is misconfigured in
  production, tokens are forgeable. Silent fallback is unacceptable.
- **C3. Client-trusted identity.** `addAttempt({ userId: "u1" })` is
  hardcoded in `app/app/quiz/[id]/page.tsx`. Attempts are not attributable
  to the actual authenticated user.
- **C4. No rate limiting.** `/api/auth` and `/api/me` are unthrottled.
  A trivial script can enumerate users or brute-force.
- **C5. No security headers.** `next.config.js` sets no CSP, X-Frame-Options,
  Referrer-Policy, or Permissions-Policy. Clickjacking and MIME sniffing
  are possible.

### High — data integrity

- **H1. localStorage is the authoritative data store.** Attempts,
  custom questions, and custom quizzes live in the browser. Multi-user
  platform is impossible without migration.
- **H2. Quiz scoring is client-side.** `app/app/quiz/[id]/page.tsx` computes
  score and gaps in the browser, then writes to localStorage. Trivial to
  forge a perfect score.
- **H3. No idempotency on submission.** Submitting the same answers twice
  creates duplicate attempts.

### Medium — dependency

- **M1. `next@14.2.5` has critical CVEs** per prior `npm audit` output:
  image optimizer DoS, HTTP request deserialization, HTTP request
  smuggling, cache poisoning, XSS in CSP nonces, SSRF in rewrites and
  WebSocket upgrades, unauthenticated RCE on Windows (Image Optimization
  API with AVIF/SVG), and more. Fix requires Next 16 (breaking).
- **M2. `postcss` ≤ 8.5.22 has XSS and path traversal CVEs.** Fix ships
  with Next 16 upgrade.

### Low — code quality

- **L1. Dynamic Tailwind classes.** `app/app/page.tsx` "پیشنهادی" section
  uses `from-${c.cover}/25`. Tailwind cannot see these at build time.
  Cards will render unstyled. Fix: static map.
- **L2. Orphaned file.** `components/AppNav.tsx` is not imported anywhere
  (superseded by `AppShell.tsx`). Safe to delete.
- **L3. Duplicated directory.** `components/components/KnowledgeGraph.tsx`
  may still exist. Safe to delete if so.
- **L4. Fabricated landing stats.** `components/marketing/Stats.tsx`
  shows "۵۰۰۰۰+ دانش‌آموز" with no label. Misleading for a product that
  has zero real users yet.
- **L5. No automated tests.** Zero coverage. Even quiz scoring — the only
  pure function — has no unit test.

### Unverified (requires running to confirm)

- **U1.** Whether `npm run build` currently succeeds on all dynamic routes.
- **U2.** Whether `middleware.ts` matcher covers all protected routes.
- **U3.** Whether any unused imports or dead exports remain.
- **U4.** Whether responsive breakpoints actually behave (visual).
- **U5.** Whether the Vazirmatn CDN loads reliably from Iranian ISPs.

---

## Security risks (exploitable today)

| # | Risk | Impact | Exploitability | Fix |
|---|------|--------|----------------|-----|
| 1 | Auth bypass (C1) | Full account takeover | Trivial | Real auth (this commit) |
| 2 | JWT fallback (C2) | Token forgery | Trivial if env missing | Fail-fast (this commit) |
| 3 | No rate limit (C4) | Brute force / enumeration | Easy | In-memory (this commit) |
| 4 | Client scoring (H2) | Fake mastery, bad analytics | Trivial | Server scoring (this commit) |
| 5 | No security headers (C5) | Clickjacking, MIME | Easy | next.config (this commit) |

---

## Recommended priorities

### P0 — before any public deploy
1. Real password authentication (bcrypt).
2. Server-side authorization on every mutating endpoint.
3. Env validation that fails closed.
4. Rate limiting.
5. Security headers.
6. Server-side quiz scoring with idempotency.
7. Migrate to Prisma + Postgres.
8. Upgrade to Next 16.

### P1 — first public release
9. Automated tests (auth, RBAC, scoring, concept gaps).
10. Demo mode isolated to development.
11. Password reset flow.
12. Email verification (if public registration).

### P2 — quality
13. Fix dynamic Tailwind (L1).
14. Remove orphans (L2, L3).
15. Label demo data (L4).
16. Align teacher/admin UI with new design tokens.

### P3 — future
17. Notifications (real).
18. Live classes.
19. Payment.
20. Concept mastery persistence at server.

---

## Data integrity risks

- Attempts keyed by `userId` string, not a foreign key. Currently "u1"
  hardcoded → all student attempts on this browser belong to "u1".
- No transaction wrapping on multi-step writes (score + gaps + attempt).
- No unique constraint preventing duplicate `(quizId, userId, takenAt)`
  submissions.

---

## Broken or incomplete features

- Payment: not implemented (documented in DECISIONS.md as out of scope).
- Live classes: not implemented.
- Notifications: bell icon is decorative.
- Profile settings: placeholder.
- Teacher course creation: only question and quiz creation exist.
- Admin user management: read-only list.
- Password reset: absent.

---

## Findings requiring further investigation

- Actual bundle sizes per route (`npm run build` output).
- Server/client component boundary — many marketing components are
  `"use client"` unnecessarily (framer-motion forces it, but Stats could
  be server-rendered with CSS animation only if we drop counters).
- CSP: currently no policy. Adding one requires enumerating Vazirmatn
  CDN, which may conflict with Iranian ISP filtering — needs testing.
- i18n: currently all-Persian. If Persian-only is intentional, no work
  needed. Confirm with product.

---

## Verification commands the user must run

```powershell
npm audit                  # record output
npx tsc --noEmit          # type check
npm run build             # production build