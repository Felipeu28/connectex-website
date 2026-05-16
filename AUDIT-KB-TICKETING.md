# Knowledge Base + Ticketing — Full Audit & Implementation Plan

**Date:** 2026-05-16
**Branch:** `claude/audit-pdf-ticketing-NBOAt`
**Goal:** Turn the AI assistant into a dedicated specialist that actually closes
tickets when it can, escalates cleanly to Mark when it can't, and scales to
many concurrent users.

---

## 1. What the user saw (the PDF screenshot)

Upload of `one-talk-t67lte-4g-desk-phone-user-guide-022122.txt` shows the
content preview as a wall of leader dots (`....................`) followed by
TOC page references like `40 Deleting all contacts`.

### Root cause

`app/api/crm/knowledge-base/route.ts` calls `extractPdfText()`, which returns
the raw output of `pdf-parse`. PDF text extraction is positional — when a
manufacturer guide is run through it, the table-of-contents dot leaders
("Searching for contacts .............. 40") are preserved verbatim, page
numbers are inlined, headers/footers repeat on every page, and line breaks
land mid-sentence. The first 200 chars (what the user previewed) end up being
pure noise — and just as bad, that noise is what the AI gets injected into
its prompt as "knowledge."

The same problem hits `.txt` files exported from PDFs (which is what the
screenshot actually shows — the `.txt` was a PDF-to-text export carrying the
same TOC artifacts).

**This is the headline bug.** Fix it and the upload UX immediately looks
professional. Fix it *and* chunk + rank the content, and the AI quality
jumps.

---

## 2. Knowledge Base — current state

### Pipeline

```
PDF/TXT/MD upload ──▶ /api/crm/knowledge-base (multipart)
                       │
                       ├─▶ Supabase Storage (kb-documents bucket)
                       └─▶ pdf-parse → raw text → kb_documents.content
                                            (truncated to 200k chars,
                                             no cleanup, no chunking)

AI chat: /api/ticketing/chat
   └─▶ loadKbDocsForCategory()  ← ignores category, ignores query,
                                   just SELECT … LIMIT 5
   └─▶ buildKnowledgeContext()  ← keyword-scores hardcoded WALKTHROUGHS

Triage: lib/ticket-triage.ts → runTriage()
   └─▶ loadKnowledge()                ← reads the 3 static .md files
   └─▶ kb_documents WHERE category IN (…)   ← full content of every match,
                                              no relevance filter, no token cap
```

### Issues found

| # | Issue | Severity | File |
|---|---|---|---|
| K1 | PDF extraction emits raw TOC dots, page numbers, headers/footers | **High** | `app/api/crm/knowledge-base/route.ts:53-62` |
| K2 | Chat's `loadKbDocsForCategory` ignores the category arg and the user's query — pulls any 5 docs | **High** | `app/api/ticketing/chat/route.ts:55-71` |
| K3 | Triage injects full document content per category, no per-query relevance filter, can blow context window | High | `lib/ticket-triage.ts:262-272` |
| K4 | No chunking — a 200k-char PDF gets dumped wholesale into the prompt and silently truncated by Gemini | High | both retrieval paths |
| K5 | No upload preview — Mark can't see what got extracted until he expands the saved doc | Medium | `app/crm/knowledge-base/page.tsx` |
| K6 | `pdf-parse` failure swallows the error and stores `(PDF uploaded — text extraction failed.)` — file is stored but is useless to AI, with no signal to retry | Medium | `app/api/crm/knowledge-base/route.ts:107-114` |
| K7 | `kb-documents` storage policy: only service role can write. OK for Mark via API, but the bucket is *private* and the upload code grabs a public URL — that URL will 401 for clients | Medium | migration 009 |
| K8 | Three migrations are numbered `009_*` — `blog_posts_anon_access.sql`, `google_integrations.sql`, `portal_and_ai_chat.sql`. Supabase applies in lexicographic order so it works, but it's fragile | Low | `supabase/migrations/` |
| K9 | `kb_documents` has no `embedding` column — no semantic search possible yet | Low (future) | migration 009 |

---

## 3. Ticketing — current state

### Pipeline

```
Client → /ticketing
   ├─ Browse help (WALKTHROUGHS, in-code)
   ├─ Ask the AI (live Gemini chat, no persistence)
   └─ Open a ticket
        │
        └─▶ POST /api/tickets (public, no auth)
              ├─ Insert ticket row + token
              ├─ Auto-link to crm_contacts by email
              ├─ Email client a "we got it" confirmation
              └─ Fire-and-forget runTriage(ticket.id)
                  ├─ Gemini decides can_handle + confidence
                  ├─ ≥65% → post AI reply, status=in_progress, email client
                  └─ <65% → email Mark with priority + reason

Client visits /ticketing/[token] (no login)
   └─ Supabase Realtime subscribes to ticket_messages
   └─ Can post replies (sender_type='client')

Client reply on a ticket
   └─ POST /api/tickets/[token]  ← sender_type from client body (impersonation)
   └─ Saves message
   └─ NO follow-up AI triage on the new reply
   └─ NO email to Mark — he only learns from realtime if logged in
```

### Issues found

| # | Issue | Severity | File |
|---|---|---|---|
| T1 | Client reply doesn't re-trigger AI — if the first AI response didn't solve it, the ticket just sits there until Mark notices | **High** | `app/api/tickets/[id]/route.ts` |
| T2 | Client reply doesn't email Mark either — silent stall | **High** | `app/api/tickets/[id]/route.ts:103` |
| T3 | `sender_type` impersonation in `POST /api/tickets/[token]` — a client can post a fake "admin" reply on their own ticket | High | `app/api/tickets/[id]/route.ts:51-54` |
| T4 | No rate limiting on `POST /api/tickets` or `POST /api/ticketing/chat` — anyone can spam tickets or drain Gemini quota | **High** | both routes |
| T5 | AI chat conversations are stateless — if the AI hits its limit and says "I'll loop in Mark", there's no one-click "save this transcript as a ticket". User has to retype | High | `components/ticketing/AiChat.tsx`, `app/api/ticketing/chat/route.ts` |
| T6 | Triage runs fire-and-forget but `runTriage` is ~6-10s — the user gets a 201 fast, but if it crashes the ticket is just "open" with no AI response and no Mark email | Medium | `app/api/tickets/route.ts:92-93` |
| T7 | Triage uses `detectCategory()` keyword OR-match — a "Verizon One Talk desk phone" hit both `verizon` and `ucaas`, doubling KB context size | Medium | `lib/ticket-triage.ts:67-79` |
| T8 | No SLA / stuck-ticket tracking — if Mark misses an email, ticket sits forever | Medium | — |
| T9 | Realtime relies on RLS `SELECT using (true)` — anyone with a token URL guess (UUIDv4, fine) can read. But anyone unauthenticated can ALSO `SELECT *` on tickets (PII leak) | High (RLS bug from 003) | `supabase/migrations/003_testing_rls.sql` (already flagged) |
| T10 | `human_took_over` is set on the *first* admin reply, but never reset — if Mark replies once then asks the AI to take it back, AI stays muted | Medium | `app/api/tickets/[id]/route.ts:99-102` |
| T11 | Ticket attachments bucket is public; PDFs of customer environments uploaded to a ticket are world-readable | Medium | `supabase/migrations/007_ticket_storage.sql` |
| T12 | No CRM "draft" composer for Mark — if he wants AI to suggest a reply he'd send manually, no UI for that | Low | — |

### Concurrency

The Postgres + Supabase Realtime stack handles many concurrent tickets fine.
The real concurrency risk is **Gemini quota** — every ticket fires a triage
call (and every chat message fires one too). At quota exhaustion, *every*
new ticket silently fails triage and just sits.

**Mitigation needed:**
- Per-IP rate limit on `POST /api/tickets` and `POST /api/ticketing/chat`
- Graceful Gemini failure: if triage fails for any reason, immediately email
  Mark with "AI triage unavailable, please review manually"
- Backoff/circuit-breaker around Gemini

---

## 4. What good ticketing systems do (research distilled)

Looking at the leaders (Intercom Fin, Zendesk AI agents, HelpScout, Plain):

1. **Deflection-first UX**: search the KB *before* the ticket form. We do
   this (Browse + Chat tabs) — keep it.
2. **AI grounded in your KB, not freeform**: every claim cites a KB article.
   Use *retrieval* not "stuff the whole KB in the prompt."
3. **Chunking + relevance**: KB content is split into ~500-1000 token chunks
   on ingest; retrieval returns top N by score (BM25 or embeddings).
4. **One-shot escalation**: when the AI gives up, the chat transcript becomes
   the ticket body — user never retypes context.
5. **Continuous AI follow-up**: AI replies to client follow-ups on the *same*
   ticket until either (a) it's solved (client confirms or closes), (b) AI
   confidence drops, or (c) human takes over.
6. **Confidence gating + handoff reason**: AI must justify why it's escalating
   so the human knows what's already been tried.
7. **SLA visibility**: aging tickets surface to the human queue, with a daily
   digest if nothing was done.
8. **PII-safe by default**: KB and ticket attachments aren't world-readable.
9. **Rate limits + abuse controls**: per-IP, per-email, captchas under load.
10. **Observability**: every AI decision is logged with prompt, response,
    confidence — so you can debug why it said the wrong thing.

We have 1, 2 (partial), 6 (partial). The plan below adds 3, 4, 5, 7, 9, 10.

---

## 5. Implementation Plan

The plan is split into **Phase 1 (this PR)** — surgical, no new infra — and
**Phase 2 (next PR)** — pgvector, portal auth, daily digest.

### Phase 1 — this PR

| # | Change | Files |
|---|---|---|
| P1 | **Clean PDF/TXT extraction** — strip TOC leader dots, repeating headers/footers, page numbers; normalize whitespace. New `lib/knowledge/pdf-clean.ts` | new |
| P2 | **Chunking + keyword retrieval** at query time. New `lib/knowledge/kb-search.ts` exporting `searchKbDocuments(query, categories, limit)` that splits each doc into ~800-char chunks, scores by query token overlap, returns top N. Used by both chat and triage | new |
| P3 | **Chat actually filters by category** + uses kb-search instead of the broken `LIMIT 5` | `app/api/ticketing/chat/route.ts` |
| P4 | **Triage uses kb-search** instead of dumping whole docs | `lib/ticket-triage.ts` |
| P5 | **Upload preview** — return cleaned-text preview (first 500 chars) in POST response; KB page shows it before the doc is saved | `app/api/crm/knowledge-base/route.ts`, `app/crm/knowledge-base/page.tsx` |
| P6 | **Rate limiting** — new `lib/rate-limit.ts` in-memory limiter; applied to `POST /api/tickets` (10/hr/IP) and `POST /api/ticketing/chat` (30/hr/IP) | new + 2 routes |
| P7 | **AI follow-up on client replies** — when a client replies on an AI-handled, not-human-taken-over ticket, re-trigger `runTriage` with the new conversation context | `app/api/tickets/[id]/route.ts`, `lib/ticket-triage.ts` |
| P8 | **Email Mark on client replies that need human attention** — if follow-up triage confidence drops OR if `human_took_over=true`, email Mark with the new client message | `app/api/tickets/[id]/route.ts`, `lib/ticket-notifications.ts` |
| P9 | **Fix sender_type impersonation** — `POST /api/tickets/[token]` forces `sender_type='client'` (admin replies go through a separate authenticated route) | `app/api/tickets/[id]/route.ts` |
| P10 | **Chat → ticket escalation** — new `POST /api/ticketing/escalate` that converts an AI chat transcript into a ticket (and triggers triage). UI adds "Open a ticket with this conversation" button | new + `components/ticketing/AiChat.tsx` |
| P11 | **Graceful Gemini failure in triage** — on any Gemini error, email Mark immediately instead of silently leaving ticket open | `lib/ticket-triage.ts` |
| P12 | **Honest extraction errors** — if `pdf-parse` returns empty/garbage, surface a clear error to the upload UI and don't save a useless doc unless Mark confirms | `app/api/crm/knowledge-base/route.ts`, `app/crm/knowledge-base/page.tsx` |

### Phase 2 — next PR (planning only here)

- **pgvector embeddings** — add `embedding vector(768)` column to `kb_documents` and a `kb_chunks` table; populate via Gemini's embedding endpoint on insert; switch `searchKbDocuments` to hybrid (BM25 + cosine).
- **Per-ticket AI decision log** — `ticket_ai_decisions` table storing every prompt/response/confidence; CRM ticket detail surfaces it.
- **Portal auth** (`/portal/*`) — client login so they see all their tickets, not just one by token.
- **Daily stuck-ticket digest** — Vercel cron at 8am CT emails Mark every ticket with no admin reply in 24h.
- **Lock down ticket attachments bucket** — switch `ticket-attachments` to private; serve attachments via signed URL.
- **Migration 013** to fix the three-way `009_*` numbering (squash + renumber or document properly).

---

## 6. Acceptance criteria for this PR

1. Uploading the Verizon One Talk PDF that produced the screenshot now stores
   readable text (no TOC dot runs, no orphan page numbers).
2. KB page shows an "extracted preview" before save so Mark can reject bad
   extractions.
3. AI chat answers a "How do I set up my One Talk desk phone?" question with
   steps that match the uploaded guide — not the hardcoded walkthrough only.
4. A client reply on an AI-handled ticket triggers a follow-up AI response
   (or a Mark escalation email) within ~10s.
5. A client cannot post a message with `sender_type='admin'`.
6. 11th ticket from the same IP in an hour is rejected with a clear error.
7. AI chat has a "Open a ticket with this conversation" button that creates
   a ticket with the transcript prefilled.
8. `npm run build` and `npm run lint` are green.

---

## 7. Risk & rollback

- All DB changes are **additive** (no schema changes in this PR). Rollback
  is `git revert`.
- Rate limiting is in-memory per-instance — on Vercel serverless this means
  the limit is effectively per-warm-instance. Good enough for v1; promote
  to Redis/Supabase-backed in Phase 2 if abuse appears.
- AI follow-up could loop (AI replies → client replies → AI replies). Guard:
  cap at 3 AI replies per ticket before forcing Mark route.
