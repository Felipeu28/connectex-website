# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (Next.js 16, Turbopack)
npm run build    # Production build
npm run lint     # ESLint v9 flat config
```

There is no test suite configured.

## Architecture

**Connectex** is a Next.js 16 (App Router) SaaS platform for a technology advisory company targeting Austin SMBs. It combines a public marketing site, a full internal CRM, and a client support portal — all in one project.

### Three distinct surfaces

1. **Marketing site** — public routes (`/`, `/about`, `/solutions/*`, `/resources/*`, `/contact`, `/partners`, `/marketplace`) built from static components and data files in `data/`.
2. **CRM app** — protected under `/crm/*`. Auth guard exists in `middleware.ts` but is **currently bypassed** (passthrough `NextResponse.next()`). The login page is at `/crm/login` — it uses Supabase magic-link OTP via `createSupabaseBrowser()`.
3. **Client support portal** — `/ticketing/*`. Public ticket submission at `/ticketing`, token-based ticket tracking at `/ticketing/[token]`. No client authentication yet — clients are told to bookmark their ticket URL. A planned revamp will add a proper `/portal/*` auth flow.

### Layout hierarchy

`app/layout.tsx` wraps everything in `MarketingShell` (nav + footer). The CRM has its own shell (`components/crm/CRMShell.tsx`) rendered directly inside CRM pages — there is no `/crm/layout.tsx`. The ticketing surface has a minimal shell at `app/ticketing/layout.tsx` (no nav/footer).

### Key directories

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router — pages, layouts, API routes |
| `app/api/` | Server-side API routes |
| `app/crm/` | CRM pages (dashboard, contacts, pipeline, campaigns, sequences, calendar, tickets, blog) |
| `app/ticketing/` | Client-facing support portal |
| `components/ui/` | Shared base UI components |
| `components/crm/` | CRM-specific modals and shell |
| `components/sections/` | Homepage marketing sections only |
| `components/ticketing/` | Ticket form and conversation thread |
| `lib/` | Supabase clients, Gemini, Google, type definitions |
| `data/` | Static content — `solutions.ts` and `posts.ts` are sole source of truth for marketing |
| `supabase/migrations/` | Ordered SQL migration files (`001_` through `008_`) |
| `lib/knowledge/` | Markdown KB files used by Gemini AI triage (verizon-devices, microsoft365, ucaas-voip) |

### Supabase client selection

There are three Supabase client helpers — use the right one for the context:

| Helper | Import | Use when |
|---|---|---|
| `createClient()` | `lib/supabase.ts` | Server Components, Route Handlers (anon key, new instance per call) |
| `createSupabaseServer()` | `lib/supabase-server.ts` | Server Components/Routes that need auth session (reads cookies) |
| `createSupabaseBrowser()` | `lib/supabase-browser.ts` | Client Components (`'use client'`) |
| `getSupabaseAdmin()` | `lib/ticket-triage.ts` | Admin operations needing `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) |

`lib/supabase.ts` also exports `createBrowserClient()` as an alias for `createSupabaseBrowser()`.

### Marketing content pattern

All solution and blog content is defined in `data/solutions.ts` and `data/posts.ts` as typed arrays. Dynamic routes (`app/solutions/[slug]/page.tsx`, `app/resources/[slug]/page.tsx`) consume these via `generateStaticParams`. To add content, add an entry to the data file — no new page files needed.

The `Solution` type requires: `slug`, `title`, `shortTitle`, `tagline`, `description`, `metaDescription`, `icon` (maps to `solutionIcons` in `components/ui/Icons.tsx`), `color`, `features[]`, `useCases[]`, `differentiators[]` (`heading`+`body`), `faqs[]` (`question`+`answer`), and `stat` (`value`+`label`).

### API routes

| Route | Purpose |
|---|---|
| `app/api/contact/route.ts` | Free vulnerability scan form submissions |
| `app/api/referral/route.ts` | Partner referral form submissions |
| `app/api/tickets/route.ts` | Ticket CRUD (GET list, POST create) |
| `app/api/tickets/[id]/route.ts` | `[id]` is actually the ticket **token** — GET ticket+messages, POST add message |
| `app/api/tickets/[id]/status/route.ts` | Status update — also sends Resend email notification |
| `app/api/tickets/triage/route.ts` | Manual AI triage trigger (POST `{ ticket_id }`) |
| `app/api/blog/route.ts` + `[id]/route.ts` | CRM blog post CRUD |
| `app/api/blog/ai-assist/route.ts` | Gemini blog content generation |
| `app/api/crm/ai-generate/route.ts` | Gemini email generation for campaigns |
| `app/api/crm/campaigns/route.ts` + `send/route.ts` | Campaign management and Resend sending |
| `app/api/google/connect/`, `callback/` | Google OAuth flow |
| `app/api/google/calendar/sync/`, `status/` | Google Calendar sync |
| `app/api/cron/sequences/route.ts` | Sequence drip (Vercel cron, hourly) |
| `app/api/cron/campaigns/route.ts` | Campaign cron (Vercel cron, every 15 min) |

### Ticketing system

Tickets are created at `POST /api/tickets`, which:
1. Inserts into `tickets` table and returns `{ token }` (a UUID, separate from internal `id`)
2. Auto-links to CRM contact by email match
3. Sends Resend confirmation email via `lib/ticket-notifications.ts`
4. Calls `runTriage(ticket.id)` from `lib/ticket-triage.ts` as fire-and-forget

**AI triage (`lib/ticket-triage.ts`):** Detects category via keyword matching → loads relevant `.md` knowledge base → calls Gemini with system prompt + knowledge + ticket. If `can_handle && confidence >= 60`: auto-responds and sets `ai_handled = true`. Otherwise: sets `routed_to_mark = true` and emails `mark@connectex.net` via Resend.

**Critical:** Triage silently no-ops if `GEMINI_API_KEY` is not set (checked at line 235). All emails also no-op if `RESEND_API_KEY` is unset.

`ticket_messages.sender_type` accepts `'client'` or `'admin'` (CHECK constraint in migration 001). The CRM ticket detail page identifies AI messages by checking `sender_name === 'Connectex AI Support'`.

### Schema / SEO helpers

`lib/schema.ts` exports JSON-LD builders: `localBusinessSchema` (injected globally), `serviceSchema` (solution pages), `breadcrumbSchema`, `faqSchema`, `blogPostSchema`. Use these — don't write raw JSON-LD inline.

### Data layer

- **Supabase** (PostgreSQL + RLS + Storage) for all persistent data
- Migrations are in `supabase/migrations/` — numbered `001_` through `008_`
- RLS policies in current migrations use `using (true)` — effectively public. Service role key (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS in `getSupabaseAdmin()`
- Storage bucket `ticket-attachments`: public read, anon upload, 10MB limit

### CRM database schema (key tables)

- `tickets` — support tickets; `token` (UUID) is the public-facing identifier
- `ticket_messages` — threaded conversation per ticket
- `crm_contacts` — contacts with pipeline stage
- `crm_deals` — deals linked to contacts
- `crm_campaigns` — email campaigns (sent via Resend)
- `crm_events` — calendar events (Google Calendar sync via `google_event_id`)
- `crm_activity` — activity log linked to contacts/deals; used by triage to log AI actions
- `crm_sequences` + `crm_sequence_steps` + `crm_sequence_enrollments` — email drip sequences
- `crm_blog_posts` — blog posts editable in CRM (migration 008)

Core TypeScript types are in `lib/crm-types.ts` (Contact, Deal, Campaign, Ticket, Activity) and `lib/ticket-types.ts` (public-facing ticket types). Read these before touching CRM or ticket features. Note: `lib/ticket-types.ts` is missing the AI fields (`ai_response`, `ai_handled`, `routed_to_mark`, `contact_id`) — those only appear in the `Ticket` interface in `lib/crm-types.ts`.

### External integrations

- **Gemini AI** — `lib/gemini.ts` — `callGemini()` / `callGeminiJSON<T>()`. Models: `GEMINI_FLASH = 'gemini-2.0-flash'` for triage and generation, `GEMINI_PRO` aliased to the same. Single-turn only; no streaming. JSON extraction uses a simple regex — fragile if response contains multiple JSON objects.
- **Resend** — transactional email from `support@connectex.net`. Used in `lib/ticket-notifications.ts` and campaign sending.
- **Google Workspace** — OAuth in `app/api/google/`, calendar sync, Gmail send via `googleapis`.
- **Vercel cron** — `vercel.json` schedules sequences hourly and campaigns every 15 min.

### Styling

Tailwind CSS v4 via `@tailwindcss/postcss`. No `tailwind.config.*` — all configuration is in `app/globals.css` using `@theme inline`. Path alias `@/*` maps to the repo root.

Key design tokens (defined in `globals.css`):
- Brand: `--color-navy` (`#0F1B2D`), `--color-primary` (`#8B2BE2`), `--color-accent` (`#00C9A7`), `--color-cta` (`#FF6B6B`)
- Semantic: `var(--bg)`, `var(--bg-card)`, `var(--border)`, `var(--text)`, `var(--text-muted)` — these switch between dark/light mode
- Dark/light theme toggled via `light` class on `<html>`; init script in `app/layout.tsx` prevents flash
- `.glass` utility class: `rgba(255,255,255,0.04)` background + `border: 1px solid rgba(255,255,255,0.08)` — used extensively in CRM and ticketing UI
- Animated components live in `components/motion/` and are re-exported from `components/motion/index.ts`

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server only, bypasses RLS) |
| `GEMINI_API_KEY` | Google Gemini API — required for AI triage and email generation |
| `RESEND_API_KEY` | Resend — required for all email notifications |
| `NEXT_PUBLIC_SITE_URL` | Base URL for email links (defaults to `https://connectex-website.vercel.app`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Google OAuth redirect URI |

### Known TODOs / placeholder content

- `middleware.ts` — CRM auth guard is bypassed; all `/crm/*` routes are publicly accessible (login page exists at `/crm/login` but is never enforced)
- `lib/ticket-triage.ts` — `sender_type` in `ticket_messages` is constrained to `'client'|'admin'`; the AI inserts messages with `sender_name = 'Connectex AI Support'` but `sender_type = 'admin'` — a planned revamp would add `'ai'` as a distinct type
- `components/sections/SocialProof.tsx` — testimonials use `[Client Name]` / `[Austin Business]` placeholders
- `components/sections/HeroSection.tsx` — trust bar has 3 empty placeholder logo boxes (`aria-hidden`)
- `lib/schema.ts` — `localBusinessSchema().sameAs` is an empty array; `blogPostSchema` author hardcoded as `'Mark'`
- `/ticketing/*` portal — planned replacement: `/portal/*` with Supabase Auth magic-link login, client dashboard, and AI chat on every message (not just one-shot triage at ticket creation)
