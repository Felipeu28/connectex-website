# Connectex CRM — Full Production Audit

**Date:** 2026-04-15  
**Scope:** CRM admin surface, API layer, auth/security, data model, integrations, build health  
**Branch:** `claude/project-audit-review-Ci6VO`

---

## 1. CRM Feature Map

| Page | Route | Purpose | Data Access | Status |
|---|---|---|---|---|
| Dashboard | `/crm/dashboard` | KPIs + activity feed | Supabase browser direct | Working |
| Contacts list | `/crm/contacts` | Paginated list, search, filter | Supabase browser direct | Working |
| Contact detail | `/crm/contacts/[id]` | Timeline, AI email draft, sequence enroll | Supabase browser + `/api/crm/ai-generate` | Working |
| Pipeline | `/crm/pipeline` | Drag-drop Kanban by deal stage | Supabase browser direct | Working — no load limit ⚠️ |
| Campaigns | `/crm/campaigns` | Create/send email campaigns with AI | Supabase browser + `/api/crm/campaigns` + `/api/crm/campaigns/send` | Working |
| Sequences | `/crm/sequences` | Multi-step drip email sequences | Supabase browser + Vercel cron | Working |
| Calendar | `/crm/calendar` | Month view + Google Calendar sync | Supabase browser + `/api/google/calendar/*` | Working |
| Tickets list | `/crm/tickets` | Support ticket queue with status filters | Supabase browser direct | Working |
| Ticket detail | `/crm/tickets/[id]` | Conversation thread + reply composer | Supabase browser + `/api/tickets/*` | Working |
| Blog list | `/crm/blog` | Manage blog articles | `/api/blog` (via API, not direct) | Working |
| Blog editor | `/crm/blog/new`, `/crm/blog/[id]` | Rich text editor + AI assist | `/api/blog/*` + `/api/blog/ai-assist` | Working |
| Login | `/crm/login` | Magic-link OTP via Supabase | Supabase auth | Exists but **not enforced** |

### API Routes

| Route | Method(s) | Purpose | Auth Required? |
|---|---|---|---|
| `/api/tickets` | POST | Create ticket (public form) | No (intentional) |
| `/api/tickets` | GET | List all tickets | **No — admin only, unprotected** |
| `/api/tickets/[token]` | GET, POST | Client ticket view + reply | Token-based |
| `/api/tickets/[id]/status` | PATCH | Update ticket status | **No — unprotected** |
| `/api/tickets/triage` | POST | Trigger AI triage | **No — unprotected** |
| `/api/crm/ai-generate` | POST | AI email generation | **No — unprotected** |
| `/api/crm/campaigns` | POST | AI campaign generation | **No — unprotected** |
| `/api/crm/campaigns/send` | POST | Send campaign emails | **No — unprotected** |
| `/api/cron/sequences` | GET | Hourly sequence drip | CRON_SECRET (optional) |
| `/api/cron/campaigns` | GET | Campaign scheduler | CRON_SECRET (optional) |
| `/api/google/connect` | GET | Initiate OAuth | No |
| `/api/google/callback` | GET | Receive OAuth code | No state check |
| `/api/google/calendar/status` | GET, DELETE | Check/remove connection | **No — unprotected** |
| `/api/google/calendar/sync` | POST | Sync events to Google | **No — unprotected** |
| `/api/blog` | GET, POST | List/create posts | GET public; POST unprotected |
| `/api/blog/[id]` | GET, PATCH, DELETE | Post ops | GET public; PATCH/DELETE unprotected |
| `/api/blog/ai-assist` | POST | AI writing help | **No — unprotected** |
| `/api/contact` | POST | Vulnerability scan form | No (intentional) |
| `/api/referral` | POST | Partner referral form | No (intentional) |

---

## 2. Critical Security Issues (Block production launch)

### 2.1 CRM auth completely bypassed — all routes public

**File:** `middleware.ts`

```typescript
export async function middleware(_request: NextRequest) {
  // TODO: Re-enable auth guard after testing
  return NextResponse.next()  // ← does nothing
}
```

- Every `/crm/*` page is accessible without authentication
- Login page (`/crm/login`) exists and works but is never enforced
- **Fix:** Replace with `proxy.ts` (Next 16 convention) with Supabase session check

### 2.2 Anon-access RLS policies still in production

**File:** `supabase/migrations/003_testing_rls.sql`

File header says "TEMPORARY" but has never been removed. Effect:
- `crm_contacts`, `crm_deals`, `crm_campaigns`, `crm_events`, `crm_activity` — `using (true) with check (true)` = world read/write
- `tickets` — `update using (true)` = anyone can update any ticket status
- `crm_sequences`, `crm_sequence_steps`, `crm_sequence_enrollments`, `crm_sequence_sends` (migration 005) — same anon_full_access pattern

The correct auth-only policies from migration 002 (`auth.role() = 'authenticated'`) are **shadowed** by these anon policies.

**Fix:** Migration 009 that drops all `anon_full_access` policies

### 2.3 Mutating API routes have no authentication

Anyone on the internet can:
- `POST /api/crm/campaigns/send` → spam emails to all CRM contacts
- `PATCH /api/tickets/[id]/status` → change/close any ticket
- `POST /api/google/calendar/sync` → create/delete events from Mark's Google Calendar
- `POST /api/blog`, `PATCH /api/blog/[id]`, `DELETE /api/blog/[id]` → publish/delete blog posts
- `POST /api/crm/ai-generate`, `POST /api/blog/ai-assist` → drain Gemini API quota

**Fix:** Auth guard on all admin API routes (see `lib/auth-guard.ts`)

### 2.4 CRON_SECRET check is optional (fail-open)

```typescript
// Both cron routes:
if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return 401
}
// If CRON_SECRET is not set, the condition is false → no check → anyone can call
```

If `CRON_SECRET` is missing from environment, both cron routes are publicly callable — anyone can trigger sequence/campaign sends.

**Fix:** Invert the guard to fail-closed

### 2.5 Gemini API key exposed in URL query string

**File:** `lib/gemini.ts:46`

```typescript
const res = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, ...)
```

The API key appears in HTTP access logs, proxy logs, and browser network tabs on any upstream proxy. Google recommends the `x-goog-api-key` request header instead.

**Fix:** Move to header, add 30-second fetch timeout via `AbortSignal.timeout()`

### 2.6 SSRF via client-supplied image_url in ticket triage

**File:** `lib/ticket-triage.ts:280`

```typescript
const imgRes = await fetch(ticket.image_url)  // URL comes from client POST body
```

Validates MIME type but not the URL itself. An attacker can submit `image_url: 'http://169.254.169.254/latest/meta-data/'` to probe cloud metadata endpoints or internal services.

**Fix:** Restrict to known HTTPS Supabase storage origin before fetching

### 2.7 OAuth callback missing state parameter validation

**File:** `lib/google-calendar.ts`, `app/api/google/callback/route.ts`

`generateAuthUrl()` has no `state` parameter. Callback doesn't verify state. Vulnerable to CSRF: attacker could trick Mark into clicking a crafted link, associating attacker's Google tokens with Mark's session.

**Fix:** Generate random state, store in httpOnly cookie, verify on callback

---

## 3. High Priority Issues

### 3.1 Pipeline loads ALL deals (no LIMIT)

`/crm/pipeline/page.tsx` queries `crm_deals` with no `.limit()`. At scale this will OOM the browser tab.

### 3.2 No error handling on data fetches

Dashboard, pipeline, contacts, sequences — none of the Supabase queries have `.catch()` or error state rendering. A transient Supabase error shows a blank page.

### 3.3 `tickets GET` exposes all tickets to the public

`GET /api/tickets` lists all tickets (names, emails, descriptions) with no auth. RLS uses anon key with `using (true)` so the query succeeds unauthenticated.

### 3.4 Admin can be impersonated in ticket replies

`POST /api/tickets/[token]` accepts `sender_type: 'admin'` from the client with no verification. A client can post a fake "admin" message to their own ticket.

**Fix:** The API route should enforce `sender_type: 'client'` for token-based access. Only authenticated admin sessions should be allowed to set `sender_type: 'admin'`.

### 3.5 Google OAuth tokens stored as plaintext in cookie

The entire `{access_token, refresh_token}` JSON is stored in an httpOnly cookie. If the cookie is ever exfiltrated (e.g., via a SSRF response that echoes headers), it grants full Gmail and Calendar access.

**Better:** Store tokens in Supabase (encrypted at rest), retrieve server-side by session ID.

### 3.6 No token refresh logic for Gmail sequences

`app/api/cron/sequences/route.ts` reads the `google_tokens` cookie and calls Gmail directly. There is no token refresh — access tokens expire in ~1 hour. After expiry, every sequence send silently fails.

**Fix:** Call `oauth2Client.refreshAccessToken()` before sending if the access_token is near expiry.

---

## 4. Next.js 16 Breaking Changes Found

| Issue | File | Status |
|---|---|---|
| `middleware.ts` deprecated → rename to `proxy.ts`, export `proxy()` | `middleware.ts` | **Fixed in this audit** |
| Async `params`/`searchParams` | Spot-checked — all pages correctly `await params` | OK |
| Turbopack at top level | `next.config.ts` already has top-level `turbopack` | OK |
| `gmail.readonly` scope requested but never used | `lib/google-calendar.ts` | Low priority |

---

## 5. Build Health

**TypeScript:** `npx tsc --noEmit` → 0 errors ✓

**ESLint (`npm run lint`):** 4 errors in CRM pages:
- `app/crm/campaigns/page.tsx:73,99` — `setState` called directly in render (should be in `useEffect`)
- `app/crm/contacts/[id]/page.tsx:69,70` — functions called before declaration in `useEffect`

**Unused dependency:** `next-sitemap` is installed but unused — Next 16 has built-in `MetadataRoute.Sitemap`

---

## 6. Data Model Issues

| Issue | Impact |
|---|---|
| Migration 003 anon policies (see §2.2) | Critical |
| No `updated_at` trigger on `tickets`, `crm_contacts`, `crm_deals` | Must update manually — risk of stale timestamps |
| `crm_sequence_enrollments.sequence_id` — no index | Slow cron joins at scale |
| `blog_posts` trigger exists for `updated_at` | OK |
| `crm_contacts.email` is nullable — code assumes it's set | Potential NPE on sequences/campaigns |
| `GEMINI_PRO` alias points to same model as `GEMINI_FLASH` | Confusing but harmless |

---

## 7. Integration Gaps

| Integration | Gap |
|---|---|
| Gemini | No retry, no timeout, key in URL, JSON extraction via regex (fragile) |
| Google Calendar | No token refresh, OAuth state missing, timezone hardcoded to `America/Chicago` |
| Gmail (sequences) | No token refresh — will break after 1h |
| Resend | `{{name}}` replacement uses `.replace()` with no HTML escaping — XSS in email if name contains `<script>` |
| Supabase Storage | Bucket `ticket-attachments` is PUBLIC — all uploaded images are world-readable |

---

## 8. Fixes Applied in This Audit

| Fix | File(s) Changed |
|---|---|
| Migrate `middleware.ts` → `proxy.ts` with real Supabase session auth guard | `proxy.ts` (new), `middleware.ts` (deleted) |
| Auth guard helper for API routes | `lib/auth-guard.ts` (new) |
| Migration 009 — drop anon_full_access, restore authenticated-only RLS | `supabase/migrations/009_lock_down_rls.sql` (new) |
| CRON_SECRET required (fail-closed) | `app/api/cron/sequences/route.ts`, `app/api/cron/campaigns/route.ts` |
| Gemini API key to header + 30s timeout | `lib/gemini.ts` |
| OAuth state param generation + validation | `lib/google-calendar.ts`, `app/api/google/connect/route.ts`, `app/api/google/callback/route.ts` |
| SSRF guard on ticket `image_url` | `lib/ticket-triage.ts` |
| Auth required on admin API routes | Blog, CRM AI, campaign send, calendar sync, tickets status, ticket triage, tickets list |

---

## 9. Remaining Recommendations (Not Applied)

These require design decisions or are lower risk:

| Recommendation | Priority |
|---|---|
| Pipeline: add `.limit(200)` + infinite scroll | High |
| Rate limiting on public forms (`/api/contact`, `/api/referral`, `POST /api/tickets`) | High |
| Google token refresh logic in cron + calendar sync | High |
| Move Google tokens from cookie to encrypted Supabase column | Medium |
| Fix tickets `sender_type` impersonation in `/api/tickets/[token]` POST | Medium |
| Replace regex JSON extraction in `callGeminiJSON` with Gemini `response_mime_type: 'application/json'` | Medium |
| Add `updated_at` triggers for `tickets`, `crm_contacts`, `crm_deals`, `crm_events` | Medium |
| Remove `gmail.readonly` scope (unused) | Low |
| Remove `next-sitemap` dependency (unused) | Low |
| Fix ESLint errors in campaigns + contact-detail pages | Low |
| Add error handling to CRM page data fetches | Low |
| Add index on `crm_sequence_enrollments(sequence_id)` | Low |
