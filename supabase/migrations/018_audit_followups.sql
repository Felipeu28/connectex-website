-- 018_audit_followups.sql
--
-- Closes the database-side items from the 2026-04-15 audit (§6, §7):
--   1. Add updated_at triggers on the mutable CRM tables that previously
--      relied on application code to set the column. Triggers are
--      idempotent (drop-and-recreate).
--   2. Index crm_sequence_enrollments(sequence_id) so the hourly cron join
--      stays fast as the table grows.
--   3. NOTE: the ticket-attachments bucket privatization is intentionally
--      not in this migration. Flipping the bucket to public=false would
--      break the publicUrl values already stored in tickets.image_url and
--      crm_contact_documents.file_url. A follow-up migration will:
--         a) add file_path columns,
--         b) backfill from the existing URLs,
--         c) switch upload helpers to return signed URLs at read time,
--         d) flip the bucket. Tracked in SECURITY.md.

set search_path to public;

-- The set_updated_at() function was created by migration 013. Re-create
-- defensively here so this migration is idempotent even on databases that
-- never applied 013 (e.g. older felipeu28 lineage).
do $$ begin
  if not exists (select 1 from pg_proc where proname = 'set_updated_at') then
    create function set_updated_at()
      returns trigger language plpgsql as $f$
      begin
        new.updated_at = now();
        return new;
      end;
      $f$;
  end if;
end $$;

-- ─── updated_at triggers ───────────────────────────────────────────────

do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'tickets' and column_name = 'updated_at') then
    drop trigger if exists tickets_updated_at on tickets;
    create trigger tickets_updated_at
      before update on tickets
      for each row execute function set_updated_at();
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'crm_contacts' and column_name = 'updated_at') then
    drop trigger if exists crm_contacts_updated_at on crm_contacts;
    create trigger crm_contacts_updated_at
      before update on crm_contacts
      for each row execute function set_updated_at();
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'crm_deals' and column_name = 'updated_at') then
    drop trigger if exists crm_deals_updated_at on crm_deals;
    create trigger crm_deals_updated_at
      before update on crm_deals
      for each row execute function set_updated_at();
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'crm_events' and column_name = 'updated_at') then
    drop trigger if exists crm_events_updated_at on crm_events;
    create trigger crm_events_updated_at
      before update on crm_events
      for each row execute function set_updated_at();
  end if;
end $$;

-- crm_emails is created by migration 013. If 013 hasn't run yet (e.g.
-- felipeu28 lineage), the to_regclass test below skips the trigger.
do $$ begin
  if to_regclass('public.crm_emails') is not null
     and exists (select 1 from information_schema.columns
                 where table_name = 'crm_emails' and column_name = 'received_at') then
    -- crm_emails uses received_at / created_at; no updated_at column today.
    -- Skip rather than invent one — noted for future schema work.
    null;
  end if;
end $$;

-- ─── sequence_enrollments index ──────────────────────────────────────────
create index if not exists idx_seq_enrollments_sequence
  on crm_sequence_enrollments(sequence_id);

create index if not exists idx_seq_enrollments_next_send_active
  on crm_sequence_enrollments(next_send_at)
  where status = 'active';
