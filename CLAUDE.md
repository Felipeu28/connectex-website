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

**ConnectEx** is a Next.js 16 SaaS platform for a technology advisory company targeting Austin SMBs. It combines a public marketing site with a full internal CRM, all in one Next.js App Router project.

### Two distinct surfaces

1. **Marketing site** — public routes (`/`, `/about`, `/solutions/*`, `/resources/*`, `/contact`, `/partners`, etc.) built from static components and data files in `data/`.
2. **CRM app** — protected under `/crm/*`, currently with auth bypassed in `middleware.ts` (TODO). All CRM pages are client-heavy and interact with Supabase directly or via API routes.

### Key directories

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router — pages, layouts, API routes |
| `app/api/` | Server-side API routes (CRM ops, Google auth, tickets, cron) |
| `app/crm/` | CRM pages (dashboard, contacts, pipeline, campaigns, sequences, calendar, tickets) |
| `components/ui/` | Shared base UI components |
| `components/crm/` | CRM-specific modals and shell |
| `components/sections/` | Marketing page sections |
| `lib/` | Supabase clients, Google/Gmail/Gemini integrations, type definitions |
| `data/` | Static content (blog posts, solution definitions) |
| `supabase/migrations/` | Ordered SQL migration files |
| `lib/knowledge/` | Markdown knowledge base files used by the AI triage engine |

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

### CRM type definitions

Core domain types (Contact, Deal, Campaign, PipelineStage, Sequence, Ticket) are in `lib/crm-types.ts` and `lib/ticket-types.ts`. Read these before touching CRM features.

### Environment variables

No `.env.example` exists. Variables referenced in code:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Google OAuth credentials, Gemini API key, Resend API key (check `lib/` files for exact names)
