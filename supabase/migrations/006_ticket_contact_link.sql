-- Link tickets to CRM contacts and add AI triage fields

alter table tickets
  add column if not exists contact_id uuid references crm_contacts(id) on delete set null,
  add column if not exists ai_response text,
  add column if not exists ai_handled boolean default false,
  add column if not exists routed_to_mark boolean default false;

create index if not exists tickets_contact_id_idx on tickets(contact_id);
create index if not exists tickets_ai_handled_idx on tickets(ai_handled);

-- Allow anon to update these new columns (existing policy covers update)
-- No new policies needed — 003_testing_rls already grants full anon access
