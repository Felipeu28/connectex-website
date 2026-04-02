-- CRM Contacts
create table if not exists crm_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  company text,
  title text,
  source text default 'manual' check (source in ('manual', 'website', 'referral', 'networking', 'cold')),
  stage text default 'lead' check (stage in ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  notes text,
  tags text[] default '{}',
  deal_value numeric(12,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pipeline deals (linked to contacts)
create table if not exists crm_deals (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references crm_contacts(id) on delete set null,
  title text not null,
  value numeric(12,2) default 0,
  stage text default 'lead' check (stage in ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  probability integer default 10 check (probability between 0 and 100),
  expected_close date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Email campaigns
create table if not exists crm_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  status text default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'paused')),
  recipients_filter jsonb default '{}',
  scheduled_at timestamptz,
  sent_at timestamptz,
  sent_count integer default 0,
  open_count integer default 0,
  click_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Calendar events
create table if not exists crm_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  type text default 'meeting' check (type in ('meeting', 'call', 'follow_up', 'task', 'other')),
  contact_id uuid references crm_contacts(id) on delete set null,
  google_event_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity log (tracks all CRM actions)
create table if not exists crm_activity (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('note', 'email', 'call', 'meeting', 'deal_update', 'stage_change', 'ticket')),
  contact_id uuid references crm_contacts(id) on delete cascade,
  deal_id uuid references crm_deals(id) on delete set null,
  description text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- RLS: all CRM tables require authenticated user
alter table crm_contacts enable row level security;
alter table crm_deals enable row level security;
alter table crm_campaigns enable row level security;
alter table crm_events enable row level security;
alter table crm_activity enable row level security;

-- Authenticated users can do everything (Mark is the only user)
create policy "auth_full_access" on crm_contacts for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on crm_deals for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on crm_campaigns for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on crm_events for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on crm_activity for all using (auth.role() = 'authenticated');

-- Indexes
create index idx_contacts_stage on crm_contacts(stage);
create index idx_contacts_email on crm_contacts(email);
create index idx_deals_stage on crm_deals(stage);
create index idx_deals_contact on crm_deals(contact_id);
create index idx_events_start on crm_events(start_time);
create index idx_activity_contact on crm_activity(contact_id);
create index idx_activity_created on crm_activity(created_at desc);
