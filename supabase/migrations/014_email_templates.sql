-- 014_email_templates.sql
-- Reusable email templates that can be loaded into the campaign / sequence /
-- one-off compose surfaces. Body is HTML; variables use {{first_name}} etc.

create table if not exists email_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default 'general' check (category in (
    'general','outreach','follow_up','introduction','meeting_request',
    'proposal','thank_you','newsletter'
  )),
  subject     text not null,
  body        text not null,
  preview_text text,
  description text,
  tags        text[] not null default '{}',
  is_archived boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_email_templates_category on email_templates(category);
create index if not exists idx_email_templates_archived on email_templates(is_archived);

alter table email_templates enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'email_templates' and policyname = 'auth_full_access'
  ) then
    execute 'create policy "auth_full_access" on email_templates for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

drop trigger if exists email_templates_updated_at on email_templates;
create trigger email_templates_updated_at
  before update on email_templates
  for each row execute function set_updated_at();

-- Seed a couple of useful starter templates.
insert into email_templates (name, category, subject, body, description) values
  ('Discovery call follow-up', 'follow_up',
   'Following up on our conversation, {{first_name}}',
   '<p>Hi {{first_name}},</p><p>Thanks for taking the time to chat today. As promised, I''ve put together a short summary of what we discussed and a couple of next steps.</p><p>Let me know what works for you.</p><p>— Mark<br/>Connectex Solutions</p>',
   'Send within 24h of a discovery call'),
  ('Cold introduction', 'introduction',
   'Quick intro from Connectex, {{first_name}}',
   '<p>Hi {{first_name}},</p><p>I help Austin-area SMBs make smart technology decisions across 600+ providers — without the markup or sales pressure.</p><p>I noticed {{company}} is growing fast. Would a 15-minute call to share what we''re seeing in your space make sense?</p><p>— Mark</p>',
   'Cold outreach to a new prospect')
on conflict do nothing;
