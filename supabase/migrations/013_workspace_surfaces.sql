-- 011_workspace_surfaces.sql
-- Tables backing the CRM workspace surfaces added in the design overhaul:
--   - crm_settings        : key/value store for workspace configuration
--   - crm_business_hours  : weekly availability (one row per weekday)
--   - crm_staff           : invited teammates (joins to auth.users when accepted)
--   - crm_emails          : unified-inbox messages synced from Gmail/Outlook
--   - crm_email_threads   : thread groupings (subject hash) for the inbox
--
-- All tables are RLS-locked to authenticated users. Service-role key bypasses
-- RLS as usual.

-- ─── 1. crm_settings ────────────────────────────────────────────────────────

create table if not exists crm_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

alter table crm_settings enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crm_settings' and policyname = 'auth_full_access'
  ) then
    execute 'create policy "auth_full_access" on crm_settings for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

-- Seed sensible defaults (idempotent).
insert into crm_settings (key, value)
values
  ('workspace.name', '"Connectex"'::jsonb),
  ('workspace.timezone', '"America/Chicago"'::jsonb),
  ('inbox.signature', '"— Sent from Connectex"'::jsonb)
on conflict (key) do nothing;

-- ─── 2. crm_business_hours ──────────────────────────────────────────────────

create table if not exists crm_business_hours (
  id          uuid primary key default gen_random_uuid(),
  weekday     int  not null check (weekday between 0 and 6), -- 0 = Sunday
  open_at     time,                                          -- null = closed
  close_at    time,
  updated_at  timestamptz not null default now()
);

create unique index if not exists idx_business_hours_weekday on crm_business_hours(weekday);

alter table crm_business_hours enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crm_business_hours' and policyname = 'auth_full_access'
  ) then
    execute 'create policy "auth_full_access" on crm_business_hours for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

-- Seed Mon–Fri 09:00–17:00, weekend closed (idempotent).
insert into crm_business_hours (weekday, open_at, close_at)
values
  (0, null, null),
  (1, '09:00', '17:00'),
  (2, '09:00', '17:00'),
  (3, '09:00', '17:00'),
  (4, '09:00', '17:00'),
  (5, '09:00', '17:00'),
  (6, null, null)
on conflict (weekday) do nothing;

-- ─── 3. crm_staff ────────────────────────────────────────────────────────────────

create table if not exists crm_staff (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'advisor' check (role in ('owner','advisor','viewer')),
  status      text not null default 'invited' check (status in ('invited','active','revoked')),
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists idx_staff_email on crm_staff(lower(email));
create index        if not exists idx_staff_user  on crm_staff(user_id);

alter table crm_staff enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crm_staff' and policyname = 'auth_full_access'
  ) then
    execute 'create policy "auth_full_access" on crm_staff for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

-- ─── 4. crm_email_threads + crm_emails ─────────────────────────────────────────

create table if not exists crm_email_threads (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid references crm_contacts(id) on delete set null,
  subject         text not null,
  participants    text[] not null default '{}',
  last_message_at timestamptz,
  message_count   int not null default 0,
  is_unread       boolean not null default false,
  is_starred      boolean not null default false,
  archived_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_email_threads_contact   on crm_email_threads(contact_id);
create index if not exists idx_email_threads_last_msg  on crm_email_threads(last_message_at desc nulls last);

alter table crm_email_threads enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crm_email_threads' and policyname = 'auth_full_access'
  ) then
    execute 'create policy "auth_full_access" on crm_email_threads for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

create table if not exists crm_emails (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references crm_email_threads(id) on delete cascade,
  contact_id    uuid references crm_contacts(id) on delete set null,
  external_id   text,                          -- gmail/outlook message id
  provider      text check (provider in ('gmail','outlook','manual')),
  direction     text not null check (direction in ('inbound','outbound')),
  from_email    text not null,
  to_emails     text[] not null default '{}',
  cc_emails     text[] not null default '{}',
  subject       text,
  body_text     text,
  body_html     text,
  is_read       boolean not null default false,
  received_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists idx_emails_thread       on crm_emails(thread_id);
create index if not exists idx_emails_contact      on crm_emails(contact_id);
create index if not exists idx_emails_received_at  on crm_emails(received_at desc);
create unique index if not exists idx_emails_external_id on crm_emails(external_id) where external_id is not null;

alter table crm_emails enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crm_emails' and policyname = 'auth_full_access'
  ) then
    execute 'create policy "auth_full_access" on crm_emails for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

-- updated_at trigger for crm_settings
do $$ begin
  if not exists (
    select 1 from pg_proc where proname = 'set_updated_at'
  ) then
    create function set_updated_at()
      returns trigger language plpgsql as $f$
      begin
        new.updated_at = now();
        return new;
      end;
      $f$;
  end if;
end $$;

drop trigger if exists crm_settings_updated_at on crm_settings;
create trigger crm_settings_updated_at
  before update on crm_settings
  for each row execute function set_updated_at();
