-- 019_partners.sql
-- Preferred partners directory — lets Mark manage local technology partners
-- from /crm/partners and surface them on the public /partners page.
--
-- Renumbered from felipeu28's 011_partners.sql to fit after moil's
-- 013_workspace_surfaces through 017_inbox_status_category.

create table if not exists partners (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text not null,
  description   text,
  website       text,
  contact_email text,
  contact_phone text,
  logo_url      text,
  color         text default '#00C9A7',
  featured      boolean default false,
  visible       boolean default true,
  sort_order    integer default 0,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists partners_visible_idx on partners(visible, sort_order);
create index if not exists partners_featured_idx on partners(featured) where featured = true;

alter table partners enable row level security;

drop policy if exists "service_role_all_partners" on partners;
create policy "service_role_all_partners"
  on partners for all
  using (auth.role() = 'service_role');

drop policy if exists "auth_full_access_partners" on partners;
create policy "auth_full_access_partners"
  on partners for all
  using (auth.role() = 'authenticated');

drop policy if exists "anon_read_visible_partners" on partners;
create policy "anon_read_visible_partners"
  on partners for select
  using (visible = true);

do $$ begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop trigger if exists partners_updated_at on partners;
    create trigger partners_updated_at
      before update on partners
      for each row execute function set_updated_at();
  end if;
end $$;
