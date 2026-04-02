-- TEMPORARY: Allow anon access to CRM tables during testing
-- Remove these policies and re-enable auth-only access before production

-- CRM Contacts
create policy "anon_full_access" on crm_contacts for all using (true) with check (true);

-- CRM Deals
create policy "anon_full_access" on crm_deals for all using (true) with check (true);

-- CRM Campaigns
create policy "anon_full_access" on crm_campaigns for all using (true) with check (true);

-- CRM Events
create policy "anon_full_access" on crm_events for all using (true) with check (true);

-- CRM Activity
create policy "anon_full_access" on crm_activity for all using (true) with check (true);

-- Also allow update on tickets (for status changes from CRM)
create policy "update_ticket" on tickets for update using (true) with check (true);
