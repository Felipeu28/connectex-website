# Migration Notice

**As of 2026-05-15 this repo is no longer the canonical source.**

The two `connectex-website` repos (`felipeu28/*` and `moil-landingpages/*`)
have been audited side-by-side — see `docs/UNIFIED_AUDIT_2026-05-15.md` for
the full comparison. The decision was to consolidate development on
`moil-landingpages/connectex-website` because it is already on the Next 16
`proxy.ts` convention, has the server-action architecture, has DB-backed
Google tokens with refresh, and ships the workspace/settings/inbox/templates
surfaces.

This repo's unique features — **Partners CRM, AI-grounded ticketing portal,
KB PDF + chat, brain graph, webhooks, email compliance / unsubscribe,
Airtable import** — will be ported into the moil baseline in Phase 3 of the
plan documented in `docs/UNIFIED_AUDIT_2026-05-15.md` (§6).

## What to do

- **New work:** open PRs against `moil-landingpages/connectex-website` only.
- **Old branches in this repo:** treat as archive / reference. Do not merge
  to `main` here.
- **Production deploy:** point Vercel at the moil repo once Phase 1 lands.
  Until then both repos can continue to deploy in parallel.

The merged history will eventually be force-mirrored back into this repo as
a read-only archive, or this repo will be archived outright. That decision
isn't blocking — current priority is to finish the merge.
