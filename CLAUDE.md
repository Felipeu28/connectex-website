# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run lint     # ESLint (flat config, v9)
```

There is no test suite configured.

## Architecture

**Connectex** is a Next.js 16 SaaS platform for a technology advisory company targeting Austin SMBs. It combines a public marketing site with a full internal CRM, all in one Next.js App Router project.

### Two distinct surfaces

1. **Marketing site** — public routes (`/`, `/about`, `/solutions/*`, `/resources/*`, `/contact`, `/partners`, `/marketplace`) built from static components and data files in `data/`.
2. **CRM app** — protected under `/crm/*`, currently with auth bypassed in `middleware.ts` (TODO: re-enable auth guard). All CRM pages are client-heavy and interact with Supabase directly or via API routes.

### Layout hierarchy

`app/layout.tsx` wraps everything in `MarketingShell` (nav + footer) and injects the `localBusinessSchema` JSON-LD globally. The CRM has its own shell in `components/crm/`. There is no separate layout file for `/crm` — the CRM shell is rendered inside CRM pages directly.

### Key directories

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router — pages, layouts, API routes |
| `app/api/` | Server-side API routes (CRM ops, Google auth, tickets, cron) |
| `app/crm/` | CRM pages (dashboard, contacts, pipeline, campaigns, sequences, calendar, tickets) |
| `components/ui/` | Shared base UI components |
| `components/crm/` | CRM-specific modals and shell |
| `components/sections/` | Marketing page sections (homepage only) |
| `lib/` | Supabase clients, Google/Gmail/Gemini integrations, type definitions |
| `data/` | Static content — `solutions.ts` and `posts.ts` are the sole source of truth for marketing content |
| `supabase/migrations/` | Ordered SQL migration files (`001_` through `007_`) |
| `lib/knowledge/` | Markdown knowledge base files used by the Gemini AI triage engine |

### Marketing content pattern

All solution and blog content is defined in `data/solutions.ts` and `data/posts.ts` as typed arrays. The dynamic routes `app/solutions/[slug]/page.tsx` and `app/resources/[slug]/page.tsx` consume these at build time via `generateStaticParams`. To add a new solution or post, add an entry to the data file — no new page files needed.

The `Solution` type requires: `slug`, `title`, `shortTitle`, `tagline`, `description`, `metaDescription`, `icon` (maps to `solutionIcons` in `components/ui/Icons.tsx`), `color`, `features[]`, `useCases[]`, `differentiators[]` (with `heading`+`body`), `faqs[]` (with `question`+`answer`), and `stat` (`value`+`label`).

### Schema / SEO helpers

`lib/schema.ts` exports ready-made JSON-LD builders: `localBusinessSchema` (injected globally in root layout), `serviceSchema` (solution pages), `breadcrumbSchema` (all pages), `faqSchema` (solution pages), `blogPostSchema` (resource pages). Use these — don't write raw JSON-LD inline.

### API routes

| Route | Purpose |
|---|---|
| `app/api/contact/route.ts` | Handles free vulnerability scan form submissions |
| `app/api/referral/route.ts` | Handles partner referral form submissions |
| `app/api/tickets/route.ts` | CRM ticket CRUD |
| `app/api/tickets/[id]/route.ts` | Single ticket ops |
| `app/api/tickets/triage/route.ts` | Gemini AI triage for incoming tickets |
| `app/api/crm/ai-generate/route.ts` | Gemini email generation for campaigns |
| `app/api/crm/campaigns/route.ts` + `send/route.ts` | Campaign management and sending via Resend |
| `app/api/google/connect/`, `callback/` | Google OAuth flow |
| `app/api/google/calendar/sync/`, `status/` | Google Calendar sync |
| `app/api/cron/sequences/route.ts` | Hourly sequence drip — triggered by Vercel cron |
| `app/api/cron/campaigns/route.ts` | Campaign cron job |

### Data layer

- **Supabase** (PostgreSQL + RLS + Storage) for all persistent data
- Three Supabase client helpers: `lib/supabase-browser.ts` (client components), `lib/supabase-server.ts` (server components/routes), `lib/supabase.ts`
- Migrations are in `supabase/migrations/` — numbered `001_` through `007_`

### External integrations

- **Google Workspace** — OAuth flow in `app/api/google/`, calendar sync, Gmail send
- **Gemini AI** — `lib/gemini.ts` — email generation and ticket triage with vision support
- **Resend** — transactional email (ticket notifications)
- **Vercel cron** — `vercel.json` schedules `/api/cron/sequences` hourly

### Styling

Tailwind CSS v4 via `@tailwindcss/postcss` PostCSS plugin. No separate `tailwind.config.*` — configuration is in CSS. Path alias `@/*` maps to the repo root.

Design tokens use CSS custom properties (`var(--bg)`, `var(--text)`, `var(--text-muted)`, `var(--border)`). Dark/light theme is toggled via a `light` class on `<html>` with the init script in `app/layout.tsx` preventing flash. Animated components live in `components/motion/` and are re-exported from `components/motion/index.ts`.

### CRM type definitions

Core domain types (Contact, Deal, Campaign, PipelineStage, Sequence, Ticket) are in `lib/crm-types.ts` and `lib/ticket-types.ts`. Read these before touching CRM features.

### Known TODOs / placeholder content

- `middleware.ts` — CRM auth guard is bypassed; all `/crm/*` routes are publicly accessible
- `components/sections/SocialProof.tsx` — testimonials use `[Client Name]` / `[Austin Business]` placeholders; not real client data yet
- `components/sections/HeroSection.tsx` — trust bar contains 3 empty placeholder logo boxes (`aria-hidden`)
- `lib/schema.ts` — `localBusinessSchema().sameAs` is an empty array; needs social profile URLs
- `lib/schema.ts` — `blogPostSchema` author is hardcoded as `'Mark'` with no last name or full Person entity

### Environment variables

No `.env.example` exists. Variables referenced in code:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Google OAuth credentials, Gemini API key, Resend API key (check `lib/` files for exact names)
