-- Expand activity types to support richer client management
alter table crm_activity drop constraint if exists crm_activity_type_check;
alter table crm_activity add constraint crm_activity_type_check
  check (type in ('note', 'email', 'call', 'meeting', 'document', 'deal_update', 'stage_change', 'ticket',
                   'deal_created', 'deal_moved', 'deal_closed', 'contact_created', 'contact_updated',
                   'ticket_created', 'ticket_resolved', 'campaign_sent'));
