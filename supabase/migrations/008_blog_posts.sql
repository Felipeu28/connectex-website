create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  category text not null default 'Strategy',
  read_time text not null default '5 min',
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  meta_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table blog_posts enable row level security;

-- Public can read published posts
create policy "Published posts are public"
  on blog_posts for select
  using (status = 'published');

-- Authenticated users have full access
create policy "Authenticated users can manage posts"
  on blog_posts for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Auto-update updated_at on change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function set_updated_at();
