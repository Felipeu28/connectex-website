-- Persistent Google OAuth tokens for Gmail + Calendar integration.
--
-- Why: tokens were previously stored in an httpOnly cookie set during the
-- OAuth callback. Vercel cron jobs are server-to-server and carry no user
-- cookies, so the sequences cron always saw "Gmail not connected" and never
-- sent a single email. Tokens now live in the DB so any server context
-- (cron, route handler, whatever) can load them.
--
-- Single-row design: id is fixed to 'default'. When/if multi-user CRM lands,
-- swap to (user_id uuid) primary key.

create table if not exists google_integrations (
  id text primary key default 'default',
  email text,
  access_token text not null,
  refresh_token text not null,
  scope text,
  token_type text,
  -- Milliseconds since epoch (matches googleapis Credentials.expiry_date)
  expiry_date bigint,
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table google_integrations enable row level security;

-- Mirrors the wide-open testing posture in 003_testing_rls.sql. Tighten when
-- middleware auth is restored.
create policy "anon_full_access" on google_integrations
  for all using (true) with check (true);
