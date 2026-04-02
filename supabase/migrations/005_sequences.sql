-- Email sequences for ConnectEx CRM

create table if not exists crm_sequences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Individual steps within a sequence
create table if not exists crm_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid references crm_sequences(id) on delete cascade,
  step_number integer not null, -- 1, 2, 3...
  delay_days integer not null default 0, -- days after previous step (0 = same day as enrollment for step 1)
  subject text not null,
  body text not null,
  created_at timestamptz default now()
);

-- Contacts enrolled in a sequence
create table if not exists crm_sequence_enrollments (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid references crm_sequences(id) on delete cascade,
  contact_id uuid references crm_contacts(id) on delete cascade,
  current_step integer default 1,
  status text default 'active' check (status in ('active', 'paused', 'completed', 'unsubscribed', 'bounced')),
  next_send_at timestamptz not null,
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  unique(sequence_id, contact_id) -- one enrollment per contact per sequence
);

-- Log of sent sequence emails
create table if not exists crm_sequence_sends (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references crm_sequence_enrollments(id) on delete cascade,
  step_id uuid references crm_sequence_steps(id) on delete set null,
  contact_id uuid references crm_contacts(id) on delete cascade,
  subject text not null,
  sent_at timestamptz default now(),
  gmail_message_id text
);

-- RLS
alter table crm_sequences enable row level security;
alter table crm_sequence_steps enable row level security;
alter table crm_sequence_enrollments enable row level security;
alter table crm_sequence_sends enable row level security;

create policy "anon_full_access" on crm_sequences for all using (true) with check (true);
create policy "anon_full_access" on crm_sequence_steps for all using (true) with check (true);
create policy "anon_full_access" on crm_sequence_enrollments for all using (true) with check (true);
create policy "anon_full_access" on crm_sequence_sends for all using (true) with check (true);

-- Indexes
create index idx_enrollments_next_send on crm_sequence_enrollments(next_send_at) where status = 'active';
create index idx_enrollments_contact on crm_sequence_enrollments(contact_id);
create index idx_sequence_steps_seq on crm_sequence_steps(sequence_id, step_number);
