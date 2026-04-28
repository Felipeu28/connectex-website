# CRM Execution Todo

## In Progress
- [x] Fix Airtable import parsing so quoted multiline CSV cells do not create phantom statuses or records.
- [x] Require authenticated admin access for CRM contact import APIs.
- [x] Restore green lint/build verification for the CRM surface before larger changes.

## Next Up
- [x] Replace the temporary `proxy.ts` bypass with real CRM and portal session gating.
- [ ] Verify Supabase migrations `009_portal_and_ai_chat.sql` and `010_lock_down_rls.sql` are applied in the target project.
- [ ] Add import dry-run reporting: parsed rows, duplicates, skipped rows, devices detected, and explicit error output.
- [ ] Add duplicate strategy for imports across both CRM and per-file uploads.
- [ ] Add import history and audit logs for admin operations.

## Phase 2
- [ ] Build a richer contact 360 view with devices, tickets, campaigns, and timeline reliability.
- [ ] Improve pipeline scalability and error handling for larger data volumes.
- [ ] Harden ticket/admin routes that still depend on app-layer checks more than necessary.
- [ ] Add automated fixtures/tests for Airtable import edge cases.

## Proof Gates
- [x] `npm run lint`
- [x] `npm run build`
- [x] Airtable CSV fixture parses to expected row/status counts
