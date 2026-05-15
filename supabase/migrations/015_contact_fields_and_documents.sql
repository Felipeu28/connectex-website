-- 015_contact_fields_and_documents.sql
-- Splits crm_contacts.name into first_name / last_name and adds a
-- phone_country_code column. The legacy `name` column stays in place and is
-- kept in sync via a trigger so existing call sites keep working.
--
-- Also adds a `crm_contact_documents` table backed by the
-- `ticket-attachments` storage bucket for per-contact file uploads.

-- ─── 1. Contact name split ────────────────────────────────────────────────────

alter table crm_contacts
  add column if not exists first_name        text,
  add column if not exists last_name         text,
  add column if not exists phone_country_code text default '+1';

-- Backfill: split existing single-line names on the first whitespace.
update crm_contacts
   set first_name = split_part(name, ' ', 1),
       last_name  = nullif(regexp_replace(name, '^\S+\s*', ''), '')
 where first_name is null;

-- Trigger keeps `name` in sync whenever first/last are set.
create or replace function sync_contact_name()
  returns trigger language plpgsql as $$
begin
  if new.first_name is not null or new.last_name is not null then
    new.name := trim(both ' ' from coalesce(new.first_name, '') || ' ' || coalesce(new.last_name, ''));
    if new.name = '' then new.name := coalesce(old.name, ''); end if;
  end if;
  return new;
end;
$$;

drop trigger if exists crm_contacts_sync_name on crm_contacts;
create trigger crm_contacts_sync_name
  before insert or update on crm_contacts
  for each row execute function sync_contact_name();

-- ─── 2. Contact documents table ───────────────────────────────────────────────

create table if not exists crm_contact_documents (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid not null references crm_contacts(id) on delete cascade,
  file_url     text not null,
  filename     text not null,
  mime_type    text,
  size_bytes   bigint,
  notes        text,
  uploaded_at  timestamptz not null default now(),
  uploaded_by  uuid references auth.users(id) on delete set null
);

create index if not exists idx_contact_documents_contact on crm_contact_documents(contact_id);
create index if not exists idx_contact_documents_uploaded on crm_contact_documents(uploaded_at desc);

alter table crm_contact_documents enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crm_contact_documents' and policyname = 'auth_full_access'
  ) then
    execute 'create policy "auth_full_access" on crm_contact_documents for all using (auth.role() = ''authenticated'')';
  end if;
end $$;
