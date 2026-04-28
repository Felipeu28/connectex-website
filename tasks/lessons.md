# Lessons

## 2026-04-28
- Airtable CSV exports can contain quoted multiline cells in notes, prompts, and attachment fields, so splitting raw text on `\n` before CSV parsing corrupts records and invents fake statuses. Parse the full file with quote-aware record handling first, then map columns.
