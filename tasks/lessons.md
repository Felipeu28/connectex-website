# Lessons

## 2026-04-28
- Airtable CSV exports can contain quoted multiline cells in notes, prompts, and attachment fields, so splitting raw text on `\n` before CSV parsing corrupts records and invents fake statuses. Parse the full file with quote-aware record handling first, then map columns.
- On Vercel with this `next@16.2.1` app, the `proxy.ts` auth gate compiled locally but anonymous production traffic still bypassed the CRM pages. A conventional root `middleware.ts` entrypoint restored the live redirect and API `401` behavior, so verify auth gates with cookie-free `curl` against production before treating route protection as fixed.
