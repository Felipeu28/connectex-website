-- 020_email_compliance.sql
-- Email compliance: per-contact unsubscribe tokens, opt-out registry, and a
-- single email_events table for sent/open/click/bounce/complaint/unsubscribe
-- correlation. Renumbered from felipeu28's 012_email_compliance.sql to fit
-- after moil's 013–017 + 018 (audit follow-ups) + 019 (partners).

alter table crm_contacts
  add column if not exists unsubscribe_token uuid default gen_random_uuid(),
  add column if not exists unsubscribed boolean default false,
  add column if not exists unsubscribed_at timestamptz;

update crm_contacts set unsubscribe_token = gen_random_uuid()
  where unsubscribe_token is null;

create unique index if not exists crm_contacts_unsubscribe_token_idx
  on crm_contacts(unsubscribe_token);

create index if not exists crm_contacts_unsubscribed_idx
  on crm_contacts(unsubscribed) where unsubscribed = true;

create table if not exists email_events (
  id            uuid primary key default gen_random_uuid(),
  event_type    text not null check (event_type in (
    'sent', 'delivered', 'opened', 'clicked',
    'bounced', 'complained', 'failed', 'unsubscribed'
  )),
  email         text not null,
  contact_id    uuid references crm_contacts(id) on delete set null,
  campaign_id   uuid references crm_campaigns(id) on delete set null,
  sequence_id   uuid references crm_sequences(id) on delete set null,
  send_id       text,
  link_url      text,
  user_agent    text,
  ip_address    text,
  raw           jsonb,
  created_at    timestamptz default now()
);

create index if not exists email_events_contact_idx       on email_events(contact_id);
create index if not exists email_events_campaign_idx      on email_events(campaign_id);
create index if not exists email_events_send_idx          on email_events(send_id);
create index if not exists email_events_type_created_idx  on email_events(event_type, created_at desc);

alter table email_events enable row level security;

drop policy if exists "service_role_all_email_events" on email_events;
create policy "service_role_all_email_events"
  on email_events for all
  using (auth.role() = 'service_role');

drop policy if exists "auth_read_email_events" on email_events;
create policy "auth_read_email_events"
  on email_events for select
  using (auth.role() = 'authenticated');

alter table crm_sequence_sends
  add column if not exists resend_message_id text;

create index if not exists crm_sequence_sends_resend_id_idx
  on crm_sequence_sends(resend_message_id);
