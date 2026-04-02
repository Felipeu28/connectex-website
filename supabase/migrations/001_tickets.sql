-- Ticketing system tables for ConnectEx client support portal

create table tickets (
  id uuid primary key default gen_random_uuid(),
  token uuid unique default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  subject text not null,
  description text not null,
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text default 'open' check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  sender_type text not null check (sender_type in ('client', 'admin')),
  sender_name text not null,
  message text not null,
  created_at timestamptz default now()
);

-- RLS policies
alter table tickets enable row level security;
alter table ticket_messages enable row level security;

-- Clients can read their ticket by token
create policy "read_ticket_by_token" on tickets for select using (true);
create policy "create_ticket" on tickets for insert with check (true);
create policy "read_messages" on ticket_messages for select using (true);
create policy "create_message" on ticket_messages for insert with check (true);
