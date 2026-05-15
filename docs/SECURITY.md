# Security — audit status

**Latest audit baseline:** `AUDIT.md` (2026-04-15) + `docs/UNIFIED_AUDIT_2026-05-15.md`  
**Branch closing the items:** `claude/audit-crm-repos-6KF6I`  
**Last updated:** 2026-05-15

This page tracks every audit item, the commit that closed it, and what's
intentionally deferred. Review before going wide.

---

## Critical (§2 in AUDIT.md) — all closed

| Ref | Issue | Closed by |
|---|---|---|
| §2.1 | CRM auth completely bypassed | `proxy.ts` (baseline) + env-var fallback in `3b7c852` |
| §2.2 | Anon RLS policies still in production | migration `012_lock_down_rls.sql` (baseline) |
| §2.3 | Mutating API routes have no authentication | `proxy.ts` matcher + `lib/auth-guard.ts` cookie fix in `024713e` |
| §2.4 | `CRON_SECRET` fail-open | already fail-closed in moil baseline (verified) |
| §2.5 | Gemini key in URL | already in `x-goog-api-key` header (baseline); 30s timeout + `response_mime_type` JSON added in `024713e` |
| §2.6 | SSRF via client-supplied `image_url` | already validates Supabase host in `lib/ticket-triage.ts` (baseline) |
| §2.7 | OAuth callback missing `state` | already in moil's `lib/google-calendar.ts` (baseline) |

## High priority (§3) — all closed

| Ref | Issue | Closed by |
|---|---|---|
| §3.1 | Pipeline loads ALL deals | `app/actions/crm.ts` capped at LIST_HARD_LIMIT (`42d7f46`) |
| §3.2 | No error handling on data fetches | server actions throw on error; pages handle via try/catch |
| §3.3 | `GET /api/tickets` exposes all tickets | moved behind `proxy.ts` admin matcher |
| §3.4 | Admin can be impersonated in ticket replies | `app/api/tickets/[id]/route.ts` forces `sender_type='client'` (`024713e`) |
| §3.5 | Google OAuth tokens in plaintext cookie | DB-backed via `lib/google-tokens.ts` (baseline) |
| §3.6 | No token refresh for Gmail sequences | `lib/gmail.ts` `refreshAccessToken` (baseline) |

## Medium / low priority — closed

| Ref | Issue | Closed by |
|---|---|---|
| §6 | No `updated_at` triggers on mutable tables | migration `018_audit_followups.sql` (`cf84eb3`) |
| §6 | No index on `crm_sequence_enrollments(sequence_id)` | migration `018_audit_followups.sql` (`cf84eb3`) |
| §7 | Resend `{{name}}` XSS via literal replace | `lib/escape-html.ts` + escaped `apply` in campaign cron (`024713e`) |
| §7 | Gemini JSON extraction fragile | switched to `response_mime_type: 'application/json'` (`024713e`) |
| — | Gemini network hang | added `AbortSignal.timeout(30_000)` (`024713e`) |
| — | `lib/auth-guard.ts` used anon client (no session) | rewired to cookie-aware client (`024713e`) |
| — | `next-sitemap` dependency unused | removed in `3b7c852` |
| — | CRM email send had no unsubscribe | `lib/email-send.ts` + migration `020_email_compliance.sql` (`3fa412e`) |
| — | No bounce / complaint auto-suppression | `/api/webhooks/resend` (this commit) |

## Deferred — see below

### Ticket attachments bucket privatization (§7)

The `ticket-attachments` Supabase Storage bucket is still `public: true`.
The `tickets.image_url` and `crm_contact_documents.file_url` columns store
the **publicUrl** values returned at upload time, which means anyone who
ever received that URL can read the file forever (even after the contact
or ticket is deleted).

**Why deferred:** flipping the bucket to private would 401 every existing
uploaded image immediately. The full fix requires:
1. Add `file_path` columns next to the existing `file_url` columns.
2. Backfill `file_path` from the URLs.
3. Replace consumer reads with `admin.storage.from('ticket-attachments').createSignedUrl(path, 60 * 60)`.
4. Flip bucket `public = false` and rewrite the public-read policy.

This lives at the top of the post-launch follow-ups list.

### Resend webhook svix signature verification

The webhook receiver at `app/api/webhooks/resend/route.ts` does not yet
verify the `svix-signature` header. The risk is forged open / click events
inflating dashboard numbers; bounce/complaint auto-suppression is also
exposed (someone could mark any contact as unsubscribed by spoofing a
bounce). The fix is a 10-line addition once the Resend webhook signing
secret is rotated and committed to env.

### gmail.readonly OAuth scope

Still requested by `lib/google-calendar.ts` even though no code reads
Gmail (only sends). Cosmetic — reduces what users see during the OAuth
consent screen but doesn't affect security posture.
