# CRM Implementation Plan

## Goal
Stabilize the ConnectEx CRM so Airtable migration works reliably, admin surfaces are protected, and the system can scale without regressions.

## Current Baseline
- Local repo is now aligned to `origin/main`.
- CRM surface exists, but import correctness, auth enforcement, and code health are still incomplete.
- The highest-impact current failure is Airtable CSV corruption during import preview and mapping.

## Phase 1: Stabilize The Foundation
- Fix Airtable parsing for quoted multiline fields.
- Require authenticated admin access on CRM import endpoints.
- Clear lint/build blockers so the CRM can be changed safely.
- Confirm Supabase RLS lockdown and portal migrations are applied in the deployment database.

## Phase 2: Make Import Production-Grade
- Move import to a typed workflow: upload, parse report, status mapping, preview, import, reconciliation.
- Preserve business metadata from Airtable:
  - contact and company details
  - address data
  - carrier, account, lead, and porting context
  - device inventory into `client_products`
- Explicitly exclude secrets:
  - passwords
  - PINs
  - secret answers
- Add duplicate handling for:
  - existing CRM contacts
  - duplicate emails within the same upload
  - contacts without email that need manual review
- Add downloadable error reporting and skipped-row reasons.

## Phase 3: Harden CRM Access And Operations
- Replace temporary `proxy.ts` bypass with optimistic session gating for `/crm`, `/portal`, and admin APIs.
- Keep authorization enforced in Supabase RLS and route-level guards.
- Review remaining admin routes for service-role usage and least-privilege boundaries.
- Add audit visibility for admin imports and bulk actions.

## Phase 4: Upgrade The CRM Experience
- Expand contact detail into a true client record:
  - products/devices
  - tickets
  - campaign enrollment
  - notes and activity integrity
- Improve pipeline resilience with better error states and larger-dataset handling.
- Add import history and operational dashboards for migration confidence.

## No-Regression Gates
- Lint passes.
- Build passes on supported Node version.
- Airtable fixture parse count matches expected row and status totals.
- Manual dry-run import confirms:
  - correct statuses
  - no phantom rows
  - device counts look sane
  - duplicates are reported rather than silently duplicated

## Rollout Order
1. Land parser/auth/code-health fixes.
2. Verify locally with the provided Airtable CSV.
3. Apply any missing Supabase migrations in the target environment.
4. Run a dry-run import with a subset of records.
5. Run the full import only after reconciliation metrics match expectations.
