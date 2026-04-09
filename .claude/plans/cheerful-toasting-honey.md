# Fix All Audit Issues — Implementation Plan

## Context
The codebase audit identified 53 issues across security, type safety, performance, error handling, code quality, offline/sync, UX, and production readiness. This plan implements all code-level fixes while flagging the items that require manual (external/infrastructure) action.

---

## What Will Be Fixed (Code Changes)

### 1. Security
**a. Bcrypt-hash admin password check** (`api/auth/auth.ts`)
- Change plain-text `password === adminPassword` to `bcrypt.compare(password, adminPassword)`
- Add backward-compat: if hash doesn't start with `$2`, fall back to plain-text with `console.warn`
- Document in plan: operator must update `ADMIN_PASSWORD` env var to a bcrypt hash

**b. Cryptographically secure device ID** (`lib/client/deviceProfile.ts`)
- Replace `Math.random()` with `crypto.randomUUID()` for device ID generation
- Keep `Date.now()` prefix for sortability

**c. Fix all `any` types**
- `api/auth/register.ts:8` — `let body: any` → typed interface `RegisterBody`
- `api/user/index.ts:43` — `let body: any` → typed interface `UpdateUserBody`
- `api/submissions/index.ts:225` — `const data: any` → typed `IpApiResponse` interface
- `lib/client/api.ts:1` — `(import.meta as any).env` → Vite-standard `import.meta.env`

### 2. Error Handling
**a. React Error Boundary** (new file `components/ErrorBoundary.tsx`)
- Class component implementing `componentDidCatch`
- Renders fallback UI ("Something went wrong") with reload button
- Wrap entire app in `App.tsx`

**b. Fix silent catch blocks in `App.tsx`**
- Add `console.error()` to all empty catch blocks
- Add user-visible toast/message for offline sync failures

**c. Guard console.info device logging** (`api/submissions/index.ts:668`)
- Wrap with `if (process.env.NODE_ENV !== 'production')` or remove

### 3. Code Quality — Deduplicate Error Utils
**a. New shared module** (`lib/client/errorUtils.ts`)
- Extract `looksLikeHtml()` and `sanitizeErrorMessage()` which are currently duplicated in `lib/client/auth.ts` and `lib/client/submissionSync.ts`

**b. Update consumers**
- `lib/client/auth.ts` — import from errorUtils, delete duplicates
- `lib/client/submissionSync.ts` — import from errorUtils, delete duplicates

### 4. Performance — Fix N+1 Leaderboard Query
**a. Add batch query to postgresStore** (`lib/server/storage/postgresStore.ts`)
- Add `getUserProfilesBatch(ids: string[])` using `WHERE id = ANY($1::text[])`

**b. Update leaderboard** (`api/leaderboard/index.ts`)
- Replace `Promise.all(topRows.map(getUserProfile))` with single `getUserProfilesBatch` call
- Add explicit `LIMIT 100` to the event query to prevent unbounded memory usage

### 5. Offline / Sync
**a. Exponential backoff** (`lib/client/offlineQueue.ts`)
- Add `retryCount` to `SyncErrorRecord`
- Implement backoff: `Math.min(30000, 1000 * 2 ** retryCount)` — cap at 30s
- Add jitter: `delay + Math.random() * 1000`

**b. Idempotency key** (`lib/client/offlineQueue.ts`, `lib/client/submissionSync.ts`)
- Generate `idempotencyKey: crypto.randomUUID()` when item is enqueued
- Include as `X-Idempotency-Key` header in `sendSubmissionPayload`

**c. Sync concurrency lock** (`App.tsx`)
- Add `isSyncingRef = useRef(false)`
- Guard `flushOfflineQueue` calls: skip if already in progress

### 6. Production Readiness
**a. Health check endpoint** (new file `api/health/index.ts`)
- `GET /api/health` — queries DB (`SELECT 1`), returns `{ status: "ok", db: "ok" | "error", ts: ISO }` with 200/503

**b. Remove mock data** (`components/Screens/Home.tsx`)
- Delete `buildMockPoints()` function and all calls to it
- Ensure the app gracefully shows empty state when no real data exists

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `lib/client/deviceProfile.ts` | crypto.randomUUID for device ID |
| `api/auth/auth.ts` | bcrypt admin password |
| `api/auth/register.ts` | typed body, remove `any` |
| `api/user/index.ts` | typed body, remove `any` |
| `api/submissions/index.ts` | typed IP response, guard console.info |
| `api/leaderboard/index.ts` | batch user query, add LIMIT |
| `lib/server/storage/postgresStore.ts` | add getUserProfilesBatch |
| `lib/client/auth.ts` | use shared errorUtils |
| `lib/client/submissionSync.ts` | use shared errorUtils, add idempotency header |
| `lib/client/offlineQueue.ts` | exponential backoff, idempotency key, retryCount |
| `App.tsx` | sync lock, fix silent catches, add Error Boundary |
| `lib/client/api.ts` | fix import.meta.env typing |
| `components/Screens/Home.tsx` | remove buildMockPoints |
| `components/ErrorBoundary.tsx` | **NEW** — React Error Boundary |
| `lib/client/errorUtils.ts` | **NEW** — shared error utilities |
| `api/health/index.ts` | **NEW** — health check endpoint |

---

## What Requires Manual / External Action (Not Code)

These will not be changed in code but are documented here:

| Issue | Required Action |
|-------|----------------|
| **Exposed .env secrets** | Rotate `AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `EDGE_CONFIG` token, `VERCEL_OIDC_TOKEN` immediately. Never commit `.env` |
| **Admin bcrypt password** | After deploying, update `ADMIN_PASSWORD` in Vercel to a bcrypt hash: `node -e "const b=require('bcryptjs');b.hash('yourpassword',10).then(console.log)"` |
| **Rate limiting** | Add Vercel Edge Middleware (`middleware.ts`) with rate limiting library (e.g. `@upstash/ratelimit`) — requires Redis/Upstash account |
| **Database constraints** | Run in Supabase SQL: `ALTER TABLE user_profiles ADD CONSTRAINT unique_email UNIQUE(email), ADD CONSTRAINT unique_phone UNIQUE(phone)` |
| **E2E tests** | Set up Playwright with `npm install -D @playwright/test` and add auth/submit/sync flows |
| **Monitoring** | Add Sentry: `npm install @sentry/react` and configure DSN |
| **i18n library** | Migrate `t(en, fr)` inline pattern to `i18next` — large refactor, do as a dedicated sprint |
| **ContributionFlow refactor** | Split into sub-components (PhotoCapture, LocationInput, FormFields) — dedicated sprint |
| **Accessibility** | Full aria-label + keyboard nav pass across all components — dedicated sprint |

---

## Verification

After implementation:
1. Run `npm run build` — must pass with no TypeScript errors
2. Run `npx vitest run` — all existing tests must pass
3. Manual smoke test: load app, auth, submit a point, check leaderboard, go offline and back
4. Hit `GET /api/health` — should return `{ status: "ok" }`
5. Confirm `buildMockPoints` is gone and app shows empty state gracefully
