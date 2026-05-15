-- 016_ticket_staff_assignment.sql
-- Wire staff (added via Settings → Staff) to tickets so each ticket can be
-- assigned to a specific advisor. crm_staff already exists from
-- 013_workspace_surfaces.sql; we just add the FK column + index.

alter table tickets
  add column if not exists assigned_staff_id uuid references crm_staff(id) on delete set null;

create index if not exists idx_tickets_assigned_staff on tickets(assigned_staff_id);

alter table crm_staff
  alter column status set default 'active';
