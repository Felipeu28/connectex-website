# Connectex CRM — Cross-Repo Unified Audit

**Date:** 2026-05-15  
**Repos audited:**
- `felipeu28/connectex-website` @ `main` (sha `ff70b83`)
- `moil-landingpages/connectex-website` @ `main` (sha `cb21a50`)

**Branch for this work (both repos):** `claude/audit-crm-repos-6KF6I`

This document is intentionally identical in both repos so the conversation lives in one place.

---

## TL;DR

The two repos came from a single ancestor (both still carry the same `AUDIT.md` baseline dated 2026-04-15) but have **diverged into two different CRMs** that each solve half the problem:

- **`felipeu28`** went **wide** — Partners CRM, AI-grounded ticketing portal, knowledge-base PDFs, brain-graph viz, webhooks, unsubscribe + email compliance. Still on Next 15-style `middleware.ts` and the old `ANON_KEY` env name.
- **`moil-landingpages`** went **deep** — Next 16 `proxy.ts`, server-action–first architecture (`app/actions/*` total ~70KB of business logic), unified email inbox, workspace settings, business hours, staff invites, contact documents, email templates, DB-backed Google tokens with refresh logic. No partners, no KB chat, no graph.

Neither is shippable alone. The goal of this branch is to **converge them into one canonical codebase** that keeps the strong half of each and resolves the security/Next-16 issues already documented in `AUDIT.md`.

---

## 1. Side-by-side surface inventory

### 1.1 CRM pages (`app/crm/*`)

| Surface | felipeu28 | moil-landingpages | Decision |
|---|---|---|---|
| dashboard | ✅ | ✅ | merge — keep moil layout, add felipeu activity feed |
| contacts (list + detail) | ✅ | ✅ (+ docs panel, country picker) | **moil wins** — adopt moil version with extra panels |
| pipeline | ✅ | ✅ | merge — add `.limit(200)` (audit §3.1) |
| campaigns | ✅ | ✅ | merge — moil's template integration + felipeu's compliance footer |
| sequences | ✅ | ✅ | merge |
| calendar | ✅ | ✅ | merge — share moil's token-refresh path |
| tickets | ✅ | ✅ (+ staff assignment, status/category) | **moil wins** |
| blog | ✅ | ✅ | identical (same SHA) — no change |
| login | ✅ | ✅ | **moil wins** (server-action `signIn`) |
| **partners** | ✅ | ❌ | **port to moil** |
| **knowledge-base** | ✅ (PDF + AI) | ✅ (structural only) | **felipeu wins** — keep PDF + chat path |
| **graph** (BrainGraph) | ✅ | ❌ | **port to moil** (optional — see §6) |
| **analytics** | ❌ | ✅ | **port to felipeu** |
| **inbox** (unified email) | ❌ | ✅ | **port to felipeu** |
| **settings** (workspace, hours, staff) | ❌ | ✅ | **port to felipeu** |
| **templates** | ❌ | ✅ | **port to felipeu** |

### 1.2 API routes (`app/api/*`)

| Route | felipeu28 | moil-landingpages |
|---|---|---|
| blog, contact, referral, tickets, cron, google | ✅ both | ✅ both |
| `/api/crm/*` (admin) | ✅ | ✅ (slimmer — server actions absorbed most logic) |
| `/api/partners/*` | ✅ | ❌ |
| `/api/ticketing/chat` (Gemini KB chat) | ✅ | ❌ |
| `/api/unsubscribe` | ✅ | ❌ |
| `/api/webhooks/*` | ✅ | ❌ |
| `app/actions/auth.ts` (server actions) | ❌ | ✅ |
| `app/actions/crm.ts` (~44 KB) | ❌ | ✅ |
| `app/actions/email.ts` (~22 KB) | ❌ | ✅ |

### 1.3 `lib/`

| File | felipeu28 | moil-landingpages | Decision |
|---|---|---|---|
| `gemini.ts` | identical | identical | keep |
| `schema.ts`, `seo.ts`, `markdown.ts`, `ticket-types.ts` | identical | identical | keep |
| `auth-guard.ts` | 1155 B | 1126 B | **moil wins** (paired with `proxy.ts`) |
| `crm-activity.ts` | 554 B | 737 B | **moil wins** |
| `crm-types.ts` | 4049 B | 4348 B | **moil wins** (has new fields) |
| `email-send.ts` | 8691 B | 4675 B | **felipeu wins** (has compliance footer / unsubscribe) |
| `gmail.ts` | 1628 B | 10661 B | **moil wins** (token refresh, MIME compose, attachments) |
| `google-calendar.ts` | 3652 B | 3912 B | **moil wins** (OAuth `state`) |
| `google-tokens.ts` | 4797 B (cookie) | 5887 B (DB) | **moil wins** (closes AUDIT §3.5) |
| `supabase.ts` / `supabase-server.ts` / `supabase-browser.ts` | split, smaller | merged, larger | **moil wins** |
| `ticket-notifications.ts` | 6294 B | 6321 B | **moil wins** (newer) |
| `ticket-triage.ts` | 18249 B | 18271 B | **moil wins** (closer to AUDIT fixes) |
| `brand.ts` | ❌ | ✅ (2422 B) | **port from moil** |
| `airtable-import.ts` | ✅ | ❌ | **port from felipeu** |
| `partner-types.ts` | ✅ | ❌ | **port from felipeu** |
| `knowledge/walkthroughs.ts` | ✅ richer | ✅ basic | **felipeu wins** |

### 1.4 Supabase migrations

```
shared       001..009 baseline (tickets / crm / RLS / sequences / blog)
felipeu only 009_blog_posts_anon_access, 009_google_integrations, 009_portal_and_ai_chat, 010_lock_down_rls, 011_partners, 012_email_compliance
moil only    010_google_integrations, 011_portal_and_ai_chat, 012_lock_down_rls, 013_workspace_surfaces, 014_email_templates, 015_contact_fields_and_documents, 016_ticket_staff_assignment, 017_inbox_status_category
```

**Problem:** both repos reuse the `009_` prefix for different content, and each has "the" `lock_down_rls` migration at a different number (010 vs 012). Any naive merge will corrupt the migration log.

**Decision:** renumber to a single canonical sequence in §5.3.

### 1.5 Top-level / config

| Item | felipeu28 | moil-landingpages | Decision |
|---|---|---|---|
| `middleware.ts` vs `proxy.ts` | `middleware.ts` | `proxy.ts` (Next 16) | **moil wins** — closes AUDIT §4 |
| env name | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | pick one (see §3) |
| `.env.example` | missing | present | **port from moil** |
| `yarn.lock` | absent | present (alongside `package-lock.json`) | delete from moil (mixed lockfiles) |
| `vercel.json` (cron) | identical | identical | keep |
| `package.json` `db:*` scripts | missing | present | **port from moil** |
| Dependencies — `pdf-parse`, `react-force-graph-2d` | present | absent | **felipeu wins** (needed for KB + graph) |

---

## 2. Outstanding security / correctness issues (still unresolved in both)

These were flagged in the 2026-04-15 audit and are **not** fully fixed in either head. The merge must close them.

| Ref | Issue | Status felipeu | Status moil | Severity |
|---|---|---|---|---|
| §2.1 | CRM auth guard | enforced via `middleware.ts` | enforced via `proxy.ts` | **OK** (use moil) |
| §2.2 | Anon RLS shadowing | lock_down at migration 010 | lock_down at migration 012 | **OK** in DB if migrations applied |
| §2.3 | Mutating API auth | guard exists in `lib/auth-guard.ts` | guard exists | **verify** each route imports it |
| §2.4 | `CRON_SECRET` fail-open | unknown — recheck | unknown — recheck | **must verify** |
| §2.5 | Gemini key in URL | `lib/gemini.ts` identical in both — needs change | same | **fix** in merged repo |
| §2.6 | SSRF via `image_url` | identical | identical | **fix** |
| §2.7 | OAuth state | moil's `google-calendar.ts` is bigger — likely fixed | only moil likely fixed | **port moil version** |
| §3.1 | Pipeline `.limit()` | not applied | not applied | **fix** |
| §3.4 | Ticket `sender_type` impersonation | open | open | **fix** in `/api/tickets/[token]` |
| §3.5 | Google tokens in cookie | open | closed (DB-backed) | **port moil version** |
| §3.6 | Gmail token refresh | open | closed (`lib/gmail.ts` 10 KB) | **port moil version** |
| §6 | `updated_at` triggers | partial | partial | add for all mutable tables |
| §7 | Resend `{{name}}` XSS escape | open | open | **fix** in `lib/email-send.ts` |
| §7 | Public `ticket-attachments` bucket | public | public | **switch to signed URLs** |

---

## 3. Recommended canonical baseline

**Pick `moil-landingpages` as the baseline** and port `felipeu28`-only surfaces on top. Rationale:

1. Already on Next 16 `proxy.ts` convention.
2. Server-action architecture (`app/actions/*`) is the direction Next is pushing — fewer round-trips, automatic CSRF protection, no "forgot to add auth guard" bugs.
3. Heavier `lib/gmail.ts` and DB-backed `google-tokens.ts` already close two of the highest-severity audit items.
4. More migrations representing real product surface (settings / staff / inbox / templates / docs) that you cannot rebuild quickly.

**One open question — env var naming:** `moil` uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `felipeu28` uses the standard `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Supabase has been rebranding `anon` → `publishable`, but most docs and the SSR cookbook still use `ANON_KEY`. **Recommendation: keep both for one release** — read from `PUBLISHABLE_KEY ?? ANON_KEY` in `lib/supabase.ts` so existing Vercel env vars don't break.

---

## 4. Things to port FROM `felipeu28` INTO the merged repo

1. **Partners CRM** — `app/crm/partners/*`, `app/api/partners/*`, `app/api/crm/partners/*`, `app/partners/page.tsx` (public read), `lib/partner-types.ts`, migration `011_partners.sql`.
2. **AI-grounded ticketing portal** — `components/ticketing/{TicketingPortal,HelpBrowse,AiChat}.tsx`, `app/api/ticketing/chat/route.ts`, `lib/knowledge/walkthroughs.ts` (felipeu version).
3. **Knowledge-base PDF upload + parse** — `app/crm/knowledge-base/*` (felipeu version), `app/api/crm/knowledge-base/*`, `pdf-parse` dep, the `kb_documents` table + `kb-documents` bucket (already in migration `009_portal_and_ai_chat`).
4. **Brain graph visualization** — `app/crm/graph/page.tsx`, `components/crm/BrainGraph.tsx`, `react-force-graph-2d` dep. Optional — flag as `EXPERIMENTAL` in nav until validated.
5. **Email compliance** — `lib/email-send.ts` (felipeu's 8.6 KB version with footer + unsubscribe token), `app/api/unsubscribe/*`, `app/unsubscribe/page.tsx`, migration `012_email_compliance.sql`.
6. **Airtable import path** — `lib/airtable-import.ts`, the bulk POST `/api/crm/contacts/import` endpoint.
7. **Webhook receivers** — `app/api/webhooks/*` (Resend events, etc).
8. **Contact import modal** — newer felipeu version that goes through admin API instead of anon client.

## 5. Things from `moil-landingpages` that `felipeu28` must adopt

1. **`proxy.ts`** replaces `middleware.ts` (delete the old file).
2. **Server actions** — `app/actions/auth.ts`, `app/actions/crm.ts`, `app/actions/email.ts`.
3. **`lib/gmail.ts`** (10 KB version with `refreshAccessToken` + MIME builder).
4. **`lib/google-tokens.ts`** (DB-backed, encrypted at rest via Supabase).
5. **`lib/brand.ts`** + the bigger `globals.css` (14 KB vs 8.9 KB — design tokens overhaul).
6. **CRM unified inbox** (`app/crm/inbox/*`, `crm_emails` / `crm_email_threads` tables in workspace_surfaces migration).
7. **Workspace settings** (`app/crm/settings/*`, `crm_settings`, `crm_business_hours`, `crm_staff`).
8. **Email templates** (`app/crm/templates/*`, migration `014_email_templates.sql`, `components/email/*` for React Email).
9. **Contact docs + custom fields** (migration `015_contact_fields_and_documents.sql`, `components/crm/ContactDocumentsPanel.tsx`, `CountryCodePicker.tsx`).
10. **Ticket staff assignment + inbox status/category** (migrations `016`, `017`, ticket detail UI updates).
11. **Analytics page** (`app/crm/analytics/*`).

---

## 5.3 Migration renumber plan

A single canonical sequence (apply only the ones that aren't yet on each prod database):

```
001_tickets.sql                       (shared baseline)
002_crm.sql                           (shared)
003_testing_rls.sql                   (shared, dropped by lock-down later)
004_expand_activity_types.sql         (shared)
005_sequences.sql                     (shared)
006_ticket_contact_link.sql           (shared)
007_ticket_storage.sql                (shared)
008_blog_posts.sql                    (shared)
009_blog_posts_anon_access.sql        (shared, both repos have it identical)
010_google_integrations.sql           (shared, both repos have it identical)
011_portal_and_ai_chat.sql            (shared, identical kb tables)
012_lock_down_rls.sql                 (shared, identical) — THIS IS THE REAL LOCK-DOWN
013_workspace_surfaces.sql            (from moil)
014_email_templates.sql               (from moil)
015_contact_fields_and_documents.sql  (from moil)
016_ticket_staff_assignment.sql       (from moil)
017_inbox_status_category.sql         (from moil)
018_partners.sql                      (was felipeu 011 — renumbered)
019_email_compliance.sql              (was felipeu 012 — renumbered)
```

All new migrations after `012` must be additive only and guarded with `if not exists` / `do $$` blocks so they're idempotent across prod databases that may already have one half or the other.

---

## 6. Implementation plan — phased

### Phase 0 — Decisions to confirm (BEFORE merging code)

- [ ] Confirm `moil-landingpages` is canonical baseline (per §3).
- [ ] Confirm env var policy: `PUBLISHABLE_KEY ?? ANON_KEY` fallback.
- [ ] Confirm which Vercel project is "prod" — that database determines which migrations are still pending.
- [ ] Decide on graph viz: ship behind a feature flag, or drop entirely?
- [ ] Decide whether to keep the legacy `/ticketing` portal during the cutover, or jump straight to `/portal/*`.

### Phase 1 — Reconcile baselines (no behavior change)

1. Add `.env.example`, `db:*` scripts, `brand.ts`, `globals.css` from moil into felipeu (or, if going from moil, no-op).
2. Switch felipeu from `middleware.ts` → `proxy.ts`; delete the old file.
3. Unify Supabase env var: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Add the missing deps in moil: `pdf-parse`, `react-force-graph-2d`.
5. Delete `yarn.lock` from moil (single lockfile).
6. Renumber migrations per §5.3; verify each is idempotent.
7. Run `npm run lint` + `npx tsc --noEmit` — fix anything broken by step 1-6.

### Phase 2 — Close the open audit items

1. `lib/gemini.ts`: move API key to `x-goog-api-key` header; add 30s `AbortSignal.timeout()`; switch JSON extraction to `response_mime_type: 'application/json'`.
2. `lib/ticket-triage.ts`: validate `image_url` against the Supabase storage origin before fetching.
3. `app/api/cron/*`: invert `CRON_SECRET` guard to fail-closed (require env var present).
4. `lib/email-send.ts`: HTML-escape `{{name}}` and any other interpolated user fields.
5. `app/api/tickets/[token]/route.ts`: force `sender_type = 'client'` on token-auth POSTs.
6. `supabase/migrations/007_ticket_storage.sql` follow-up: switch `ticket-attachments` bucket to private + signed URLs in the read paths.
7. Pipeline page: `.limit(200)` + paginate / infinite-scroll.
8. Add `updated_at` triggers on `tickets`, `crm_contacts`, `crm_deals`, `crm_events`, `crm_emails`.
9. Add index `idx_seq_enrollments_sequence on crm_sequence_enrollments(sequence_id)`.
10. Drop unused `gmail.readonly` scope, drop `next-sitemap` dep.

### Phase 3 — Port felipeu-only surfaces into moil baseline

In this order (each step is its own commit + can be tested independently):

1. `lib/airtable-import.ts` + `lib/partner-types.ts` + `lib/knowledge/walkthroughs.ts` (felipeu version).
2. Migration `018_partners.sql` (renumbered).
3. Partners CRM page + API + public `/partners` page.
4. Knowledge-base page (felipeu version) + `/api/crm/knowledge-base` POST with `pdf-parse`.
5. `/ticketing` AI chat — `TicketingPortal`, `HelpBrowse`, `AiChat`, `/api/ticketing/chat`.
6. Migration `019_email_compliance.sql` + `lib/email-send.ts` (felipeu) + `/api/unsubscribe` + `/unsubscribe` + footer injection in campaign + sequence sends.
7. `/api/webhooks/*` receivers (Resend bounce/complaint).
8. Brain graph (optional, behind `EXPERIMENTAL_GRAPH=1` flag).

### Phase 4 — Adopt moil-only surfaces into felipeu surfaces (parity check)

1. Unified inbox + `crm_emails` Gmail sync cron.
2. Workspace settings page (`workspace.name`, timezone, business hours) — wire timezone into calendar + sequence sends (was hardcoded `America/Chicago`).
3. Staff invites flow — `crm_staff` table + magic-link invite.
4. Email templates UI + Resend template selection in campaigns.
5. Contact documents panel + custom fields.
6. Ticket staff assignment + inbox status/category filters.
7. Analytics page.

### Phase 5 — Polish, tests, docs

1. Add an `e2e/` script that spins up a Supabase shadow DB, runs all migrations in order, and asserts a happy-path login → create-contact → send-campaign → receive-ticket → AI-triage chain.
2. Update `CLAUDE.md` + `AGENTS.md` to reflect the merged repo.
3. Add a `SECURITY.md` summarizing the audit fixes.
4. Final pass: `npm run lint`, `tsc --noEmit`, `npm run build`.
5. Tag `v1.0-merged` once both Vercel previews are green.

---

## 7. Risks

1. **Migration order is the single biggest landmine.** If one prod DB has felipeu's `011_partners` and the other has moil's `011_portal_and_ai_chat`, blind renumbering will fail. Mitigation: run the canonical script against a Supabase shadow DB before pushing.
2. **Server actions vs API routes** — moil moved a lot of logic into `app/actions/crm.ts` (44 KB). Felipeu's pages call `/api/crm/*` directly. Either rewrite felipeu's pages to use the actions, or keep `/api/crm/*` as thin adapters over the actions. Recommendation: thin adapters during cutover, deprecate later.
3. **`react-force-graph-2d` is unmaintained-ish** and pulls in canvas/WebGL deps. Consider replacing with `vis-network` or dropping.
4. **`pdf-parse` ships its own test PDF and is known to crash on certain Node serverless runtimes.** Pin version + add try/catch with clear error message (felipeu already does this).
5. **Two separate Vercel deployments** — until repos converge, do NOT cross-point DNS. Each should keep its own preview URL.

---

## 8. Suggested branch + PR strategy

Work happens on `claude/audit-crm-repos-6KF6I` in **both** repos in lockstep. Per phase:

1. Commit the same content to both repos on the same branch with the same message.
2. Open a PR on each repo with the same title; cross-link them in the description.
3. Merge them on the same day.
4. After Phase 3, declare one repo the survivor and archive the other (or fold one into a fork-mirror of the other).

**This document is the single source of truth.** Update it in both repos identically as decisions land.

---

## Appendix A — Files that are already byte-identical between the two repos

(`sha` match — safe to ignore during merge.)

```
AGENTS.md, README.md, app/apple-icon.tsx, app/icon.tsx, app/favicon.ico,
app/layout.tsx, app/loading.tsx, app/not-found.tsx, app/opengraph-image.tsx,
app/page.tsx, app/robots.ts, app/template.tsx,
app/crm/page.tsx, components/crm/BlogEditor.tsx, components/crm/ClientProductsPanel.tsx,
lib/gemini.ts, lib/markdown.ts, lib/schema.ts, lib/seo.ts, lib/ticket-types.ts,
eslint.config.mjs, next.config.ts, postcss.config.mjs, tsconfig.json, vercel.json,
supabase/migrations/001_tickets.sql through 009_blog_posts_anon_access.sql (all 9 identical),
supabase/migrations/010_google_integrations.sql (identical, just different number prefix in felipeu),
supabase/migrations/lock_down_rls.sql content (identical, different number prefix),
supabase/migrations/portal_and_ai_chat.sql content (identical, different number prefix).
```

## Appendix B — Quick-reference: where each feature lives today

| Feature | Repo | Path |
|---|---|---|
| Partners CRM | felipeu | `app/crm/partners/`, `app/api/partners/`, migration `011_partners.sql` |
| KB PDF + AI chat | felipeu | `app/crm/knowledge-base/`, `app/api/ticketing/chat/`, `lib/knowledge/` |
| Brain graph | felipeu | `app/crm/graph/`, `components/crm/BrainGraph.tsx` |
| Webhooks | felipeu | `app/api/webhooks/` |
| Unsubscribe + email compliance | felipeu | `app/api/unsubscribe/`, `app/unsubscribe/`, migration `012_email_compliance.sql` |
| Unified email inbox | moil | `app/crm/inbox/`, migration `013_workspace_surfaces.sql` (crm_emails) |
| Workspace settings | moil | `app/crm/settings/`, migration `013_workspace_surfaces.sql` (crm_settings/business_hours/staff) |
| Email templates | moil | `app/crm/templates/`, migration `014_email_templates.sql`, `components/email/` |
| Contact documents + custom fields | moil | `components/crm/ContactDocumentsPanel.tsx`, migration `015_*` |
| Ticket staff assignment | moil | migration `016_*` |
| Analytics page | moil | `app/crm/analytics/` |
| Server actions | moil | `app/actions/{auth,crm,email}.ts` |
| Gmail w/ token refresh | moil | `lib/gmail.ts` (10 KB), `lib/google-tokens.ts` (5.8 KB) |
