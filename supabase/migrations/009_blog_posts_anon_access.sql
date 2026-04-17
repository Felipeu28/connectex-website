-- TEMPORARY: Allow anon access to blog_posts during CRM testing
-- Consistent with 003_testing_rls.sql pattern for other CRM tables
-- Remove before production when auth is re-enabled

create policy "anon_full_access" on blog_posts
  for all using (true) with check (true);
