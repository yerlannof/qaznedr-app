# Security Audit — QAZNEDR.KZ

Scope: RLS, API auth coverage, rate-limit coverage, Stripe webhook, secrets, input validation, dangerouslySetInnerHTML. Static read-only analysis.

## Executive summary

The **leads layer** (leads / lead_private / lead_entitlements) is well-designed: deny-all RLS on gated tables, service-role reads strictly after an entitlement check, NextAuth-backed admin guard, audit logging, watermarking. Admin routes consistently call `requireAdmin()` / `requireSuperAdmin()`.

The risk is concentrated in the **older `kazakhstan_deposits` stack** and a few **unauthenticated observability endpoints**:

1. **kazakhstan_deposits RLS is broken / contradictory** across 3 migrations — the most recent one (`20250117`) installs `USING (true)` for public SELECT, which (if applied) exposes DRAFT / PENDING_MODERATION / DELETED listings plus `user_id`, `license_number`, `coordinates` to the anon key. (P0)
2. **All `kazakhstan_deposits` write/ownership RLS keys on `auth.uid()`**, but the app authenticates via **NextAuth, not Supabase Auth**, so `auth.uid()` is always NULL — every owner policy is dead. (P1, design)
3. **`GET /api/errors` and `GET /api/analytics` are unauthenticated** and dump the full error/analytics tables (messages, stack traces, userIds, client IPs, user agents, URLs). (P1, info disclosure)
4. **Rate limiting fails open**: if `UPSTASH_REDIS_REST_*` env vars are missing (or Redis errors), `withRateLimit` silently no-ops every protected route. (P1)
5. **Several mutation routes guard on `supabase.auth.getUser()`** (always null under NextAuth) → functionally always 401 (not a hole), but indicates the auth model was never wired for these routes. (P2)
6. **JSON-LD `dangerouslySetInnerHTML` does not escape `<`** → latent stored-XSS if listing/lead title or description ever contains `</script>`. (P2)

Stripe webhook signature validation: **PRESENT and correct**. No hardcoded secrets found. Service-role key never leaks to client components.

---

## 1. RLS — kazakhstan_deposits (P0 / P1)

### 1a. Conflicting SELECT policies; latest is `USING (true)` — P0

Three different migrations each create a public SELECT policy on `kazakhstan_deposits`:

- `supabase/migrations/002_row_level_security.sql:14` → `USING (status = 'ACTIVE' OR user_id = auth.uid())` (safe-ish)
- `supabase/migrations/20240101000002_add_rls_policies.sql:14` → `USING (status = 'ACTIVE' OR user_id = auth.uid())` (safe-ish)
- `supabase/migrations/20250117_create_kazakhstan_deposits.sql:64` → **`"Allow public read access" ... FOR SELECT USING (true)`** (UNSAFE)

Postgres combines multiple **permissive** policies with OR. If more than one of these policies exists on the live table, the `USING (true)` policy wins → **anon key can read every row regardless of status**, including:

- DRAFT, PENDING_MODERATION, REJECTED, DELETED listings (unpublished/soft-deleted data)
- `user_id` (owner identity), `license_number`, `coordinates` (exact GPS), `documents` JSON

Even the "safe" policies expose `user_id` of owners and don't hide `license_number`/`coordinates` of ACTIVE rows, but the `USING(true)` policy is the acute issue.

**Action — verify live DB then fix (S):** Run in Supabase SQL editor:

```sql
SELECT polname, cmd, qual FROM pg_policies WHERE tablename = 'kazakhstan_deposits';
```

Drop the permissive `USING(true)` policy and replace with a single canonical SELECT policy that only exposes publicly-safe statuses, e.g.:

```sql
DROP POLICY IF EXISTS "Allow public read access" ON kazakhstan_deposits;
DROP POLICY IF EXISTS "Public can view active listings" ON kazakhstan_deposits;
DROP POLICY IF EXISTS "Anyone can view active deposits" ON kazakhstan_deposits;
CREATE POLICY "public read active" ON kazakhstan_deposits
  FOR SELECT USING (status = 'ACTIVE');
```

Consider a separate public-safe view that strips `user_id`, exact `coordinates`, and `documents` for anon reads.

NOTE: The public catalog (`/api/listings` GET, `src/app/api/listings/route.ts`) already filters server-side, but RLS is the actual trust boundary for direct anon-key queries (e.g. from the browser `createClient()`), so the policy must be correct independent of route code.

### 1b. Ownership/write RLS uses `auth.uid()` but app uses NextAuth — P1 (design)

`20250117_create_kazakhstan_deposits.sql:68` and the `002`/`20240101` migrations gate INSERT/UPDATE/DELETE and owner-SELECT on `auth.uid() = user_id`. The portal authenticates with **NextAuth (Supabase Auth not used)** — confirmed by `src/lib/auth/admin.ts` using `getServerSession` + `createServiceClient`, and by `src/lib/supabase/client.ts`/`server.ts` creating clients with only the anon key and no Supabase session. Therefore `auth.uid()` is always NULL and **every owner policy evaluates to false** — owners cannot read/write their own rows via the anon key; all real writes go through the service-role key (which bypasses RLS) inside server routes. The policies give a false sense of security and are dead. Document the model: gated tables = RLS deny-all + service-role-after-app-check (as the leads layer already does), and remove/rewrite the `auth.uid()` deposit policies to avoid confusion. (S)

---

## 2. API auth coverage

### 2a. `GET /api/errors` — unauthenticated full error-log dump — P1

`src/app/api/errors/route.ts:76` — no session/admin check. Returns `errorLog` rows incl. `message`, `stack`, `userId`, `url`, `component`, plus aggregates. Anyone can enumerate internal errors, user IDs, and stack traces. **Fix (S):** wrap GET in `requireAdmin()` (return `forbidden()` if null). The POST (ingest, line 13) can stay public but should be rate-limited (see §3).

### 2b. `GET /api/analytics` — unauthenticated analytics dump — P1

`src/app/api/analytics/route.ts:80` — no auth. Returns `analyticsEvent` rows incl. `userId`, `sessionId`, `clientIP`, `userAgent`, `properties`. PII / behavioral data exposure. **Fix (S):** require admin on GET.

### 2c. `GET /api/metrics` — auth only if env token set (fail-open) — P2

`src/app/api/metrics/route.ts:128-135` — gated by `METRICS_AUTH_TOKEN` **only in production AND only if the env var is set**. If `METRICS_AUTH_TOKEN` is unset, the `if (expectedAuth && ...)` short-circuits and metrics are served to anyone. **Fix (S):** deny by default — if `!expectedAuth` in production, return 401.

### 2d. `POST /api/indexnow` — unauthenticated, no rate limit — P2

`src/app/api/indexnow/route.ts:5` accepts arbitrary `urls[]` and proxies to `api.indexnow.org`. Host is hardcoded to `qaznedr.kz` so SSRF is limited, but it is an unauthenticated outbound-request amplifier with no rate limit. The IndexNow key in source (`INDEXNOW_KEY = 'qaznedr2026indexnow'`, line 3) is acceptable (IndexNow keys are public by design). **Fix (S):** add `withRateLimit(..., 'public')` and optionally require an internal token.

### 2e. Mutation routes guarding on dead `supabase.auth.getUser()` — P2 (functional + clarity)

These return 401 unconditionally under NextAuth (so not a hole), but the intended auth never fires:

- `src/app/api/listings/route.ts:507` (POST create listing) — `supabase.auth.getUser()`
- `src/app/api/services/route.ts:89` (POST create service) — `supabase.auth.getUser()`
- `src/app/api/gdpr/export/route.ts:25` and `gdpr/delete` — `supabase.auth.getUser()`

**Fix (M):** migrate these to `getServerSession(authOptions)` like the leads routes; otherwise listing/service creation and GDPR self-service are silently broken. Until fixed, listing creation is impossible via this route (cross-reference the data-layer audit's dual-ORM/Prisma findings).

### 2f. Admin routes — VERIFIED OK

Every route under `src/app/api/admin/**` calls `requireAdmin()` or `requireSuperAdmin()` (grep showed a guard call in each). DELETE handlers (`admin/listings/[id]/route.ts:128`, `admin/users/[id]/route.ts`) are guarded; user role mutation requires `requireSuperAdmin()`. Good.

---

## 3. Rate-limit coverage

### 3a. Rate limiting fails open when Redis is unconfigured — P1

`src/lib/middleware/rate-limiting.ts:9-11` returns `null` when `UPSTASH_REDIS_REST_URL`/`_TOKEN` are missing, and line ~281-284 the wrapper catches errors and **allows the request**. Net effect: if Upstash is not provisioned in the deployed environment, **all `withRateLimit` protection silently disappears** (leads unlock, payments, search, auth). **Fix (M):** in production, fail closed (or at minimum emit a startup error + alert) when no rate-limit backend is configured; add a health check asserting the limiter is live.

### 3b. Routes WITHOUT rate limiting:

- `POST /api/errors` (`errors/route.ts:13`) — unauthenticated ingest, unbounded → DB write flood. (P2)
- `POST /api/analytics` (`analytics/route.ts:20`) — same. (P2)
- `POST /api/indexnow` — see §2d. (P2)
- `POST /api/contact-view` (`contact-view/route.ts:8`) — auth'd but no rate limit; insert per call. (P3)
- `POST /api/listings` uses its own `rateLimit(request)` (line 484) — OK but depends on §3a.

### 3c. Properly rate-limited (verified): `leads/[code]/request` (`payments` bucket), `leads/[code]` (`search`), `payments/create-intent` (`payments`), `search/*` (`verifyRateLimit`), `gdpr/export`+`gdpr/delete` (`rateLimit`). Good.

---

## 4. Stripe webhook — VERIFIED SECURE

`src/app/api/payments/webhook/route.ts` validates the `stripe-signature` header (rejects if missing, line 32) and verifies the signature via `stripePaymentService.handleWebhook(body, signature)` (line 46), returning 400 on failure (line 51). Wrapped in `withStripeWebhookSecurity` and `validateWebhookEvent`. Raw body read with `request.text()` before parsing. **No console.log stub for signature** — it is real verification.

Caveats (not security holes): the actual DB side-effects (mark SOLD, create transaction, notifications) are all commented out / TODO (lines 90-258) — so a verified `payment_intent.succeeded` currently does nothing. The `default` branch uses `console.log` (`webhook/route.ts:261`) and there is a `console.error` (line 273) and `console.log` in `create-intent` (line 112) — violates the project's no-console rule and may leak payment metadata to logs. (P3)

One concern: `payments/create-intent/route.ts:106` builds a `securityHash` using `process.env.STRIPE_WEBHOOK_SECRET` and stuffs it into **Stripe metadata** (`base64`-encoded, reversible). Putting any secret-derived value (even hashed-by-base64, which is NOT hashing) into Stripe metadata that round-trips to the client is poor practice. Base64 is trivially reversible, so this leaks a value derived from the webhook secret. **Fix (S):** use an HMAC (e.g. `crypto.createHmac('sha256', secret)`) not `Buffer.from(...).toString('base64')`, or drop it entirely.

---

## 5. Secrets — VERIFIED CLEAN

- No hardcoded API keys/tokens/passwords in `src/` (grep for `secret|api_key|token|password|service_role = '...'` returned nothing actionable).
- `SUPABASE_SERVICE_ROLE_KEY` is read only in `src/lib/supabase/server.ts:46` (`createServiceClient`), which is server-only; no `'use client'` file imports it.
- Only the anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) reaches the browser client — correct.
- Minor: `client.ts`/`server.ts` fall back to `'placeholder-key'` / `'placeholder-service-key'` strings at build time — harmless but ensure prod env vars are actually set (otherwise the limiter §3a and clients run on placeholders).

---

## 6. Input validation (zod)

- `payments/create-intent/route.ts:14` — zod schema (uuid, positive amount, currency enum). Good.
- `listings/route.ts:523` — zod via `validateRequest` + `sanitizeMiningInput`. Good (once auth is fixed).
- `leads/[code]/request/route.ts:26-27` — manual `String(...).slice()` clamping (no zod, but bounded). Acceptable.
- `services/route.ts:98-143` — **manual validation only, no zod**; field whitelist + length slicing present, so injection risk is low, but inconsistent with project standard. (P3)
- `errors/route.ts` / `analytics/route.ts` POST — accept loosely-typed JSON straight into Prisma; `errors` uses `validateRequired` only. Add zod + size caps. (P3)

---

## 7. dangerouslySetInnerHTML

All 7 usages are `<script type="application/ld+json">` JSON-LD blocks (safe content type), NOT arbitrary HTML:

- `src/app/[locale]/listings/[id]/page.tsx:275, 281`
- `src/app/[locale]/leads/[code]/page.tsx:270`
- `src/app/[locale]/listings/page.tsx:164`
- `src/app/[locale]/page.tsx:65, 71`
- `src/app/[locale]/services/page.tsx:129`

**Latent XSS — P2:** they emit `JSON.stringify(jsonLd)` with no `<`/`/`/`<!--` escaping. `JSON.stringify` does NOT escape `<`, so if the serialized object contains a listing/lead `title` or `description` with `</script><script>alert(1)</script>`, it breaks out of the JSON-LD script and executes. Listing content is admin-curated today (low likelihood) but the create-listing flow (§2e) is user-facing by design. **Fix (S):** sanitize the serialized JSON-LD, e.g. `.replace(/</g, '\\u003c')` on the stringified output, or use a helper that escapes `<`, `>`, `&`, U+2028/U+2029.

---

## Priority index

| #   | Finding                                                                     | Sev | Effort |
| --- | --------------------------------------------------------------------------- | --- | ------ |
| 1a  | kazakhstan_deposits `USING(true)` SELECT policy exposes DRAFT/deleted + PII | P0  | S      |
| 3a  | Rate limiting fails open if Upstash unconfigured/errors                     | P1  | M      |
| 2a  | `GET /api/errors` unauthenticated log dump                                  | P1  | S      |
| 2b  | `GET /api/analytics` unauthenticated PII dump                               | P1  | S      |
| 1b  | Deposit owner RLS keys on dead `auth.uid()` (NextAuth)                      | P1  | S      |
| 2e  | Listing/service/GDPR routes use dead `supabase.auth.getUser()`              | P2  | M      |
| 7   | JSON-LD dangerouslySetInnerHTML not `<`-escaped (latent XSS)                | P2  | S      |
| 2c  | `GET /api/metrics` fail-open when METRICS_AUTH_TOKEN unset                  | P2  | S      |
| 2d  | `POST /api/indexnow` unauth + no rate limit                                 | P2  | S      |
| 4   | create-intent puts webhook-secret-derived base64 in Stripe metadata         | P2  | S      |
| 3b  | errors/analytics/indexnow POST ingest unrate-limited                        | P2  | S      |
| 6   | services/errors/analytics POST lack zod                                     | P3  | S      |
| 4   | console.log of payment metadata (no-console rule)                           | P3  | S      |
