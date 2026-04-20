-- 009_lock_down_rls.sql
-- Removes temporary anon_full_access policies created in 003_testing_rls.sql
-- and 005_sequences.sql. Re-locks all CRM tables to authenticated users only.
-- Run this before going to production.

-- ─── Drop anon_full_access policies from 003_testing_rls.sql ─────────────────

drop policy if exists "anon_full_access" on crm_contacts;
drop policy if exists "anon_full_access" on crm_deals;
drop policy if exists "anon_full_access" on crm_campaigns;
drop policy if exists "anon_full_access" on crm_events;
drop policy if exists "anon_full_access" on crm_activity;

-- Also drop the unrestricted ticket update policy added in 003
drop policy if exists "update_ticket" on tickets;

-- ─── Drop anon_full_access policies from 005_sequences.sql ───────────────────

drop policy if exists "anon_full_access" on crm_sequences;
drop policy if exists "anon_full_access" on crm_sequence_steps;
drop policy if exists "anon_full_access" on crm_sequence_enrollments;
drop policy if exists "anon_full_access" on crm_sequence_sends;

-- ─── Ensure auth_full_access policies exist (002_crm.sql may have created them,
--     but re-declare idempotently to be safe) ───────────────────────────────────

-- CRM core tables (created in 002_crm.sql — these should already exist)
-- Using `create policy if not exists` syntax if Supabase version supports it,
-- otherwise drop-and-recreate pattern:

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crm_sequences' and policyname = 'auth_full_access'
  ) then
    execute 'create policy "auth_full_access" on crm_sequences for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crm_sequence_steps' and policyname = 'auth_full_access'
  ) then
    execute 'create policy "auth_full_access" on crm_sequence_steps for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crm_sequence_enrollments' and policyname = 'auth_full_access'
  ) then
    execute 'create policy "auth_full_access" on crm_sequence_enrollments for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crm_sequence_sends' and policyname = 'auth_full_access'
  ) then
    execute 'create policy "auth_full_access" on crm_sequence_sends for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

-- ─── Tickets: tighten update policy ──────────────────────────────────────────
-- Allow update only by authenticated users (CRM admin).
-- Public clients interact via token-based GET/POST on /api/tickets/[token].
-- The cron and admin routes use the service role key which bypasses RLS.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'tickets' and policyname = 'admin_update_ticket'
  ) then
    execute 'create policy "admin_update_ticket" on tickets for update using (auth.role() = ''authenticated'')';
  end if;
end $$;

-- ─── Add updated_at triggers for tables missing them ─────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- tickets
drop trigger if exists tickets_updated_at on tickets;
create trigger tickets_updated_at
  before update on tickets
  for each row execute function set_updated_at();

-- crm_contacts (migration 002 sets default but no trigger)
drop trigger if exists crm_contacts_updated_at on crm_contacts;
create trigger crm_contacts_updated_at
  before update on crm_contacts
  for each row execute function set_updated_at();

-- crm_deals
drop trigger if exists crm_deals_updated_at on crm_deals;
create trigger crm_deals_updated_at
  before update on crm_deals
  for each row execute function set_updated_at();

-- crm_campaigns
drop trigger if exists crm_campaigns_updated_at on crm_campaigns;
create trigger crm_campaigns_updated_at
  before update on crm_campaigns
  for each row execute function set_updated_at();

-- crm_events
drop trigger if exists crm_events_updated_at on crm_events;
create trigger crm_events_updated_at
  before update on crm_events
  for each row execute function set_updated_at();

-- crm_sequences
drop trigger if exists crm_sequences_updated_at on crm_sequences;
create trigger crm_sequences_updated_at
  before update on crm_sequences
  for each row execute function set_updated_at();

-- ─── Add missing index on sequence enrollments ───────────────────────────────

create index if not exists idx_enrollments_sequence
  on crm_sequence_enrollments(sequence_id);
