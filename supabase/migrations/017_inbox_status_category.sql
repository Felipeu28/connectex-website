-- Inbox enhancements: per-thread support status, category tag, and a stable
-- pointer back to the Gmail thread so replies can be sent into the same
-- conversation rather than starting a new one.

alter table crm_email_threads
  add column if not exists status text not null default 'open'
    check (status in ('open','resolved')),
  add column if not exists category text,
  add column if not exists external_thread_id text;

create index if not exists idx_email_threads_status
  on crm_email_threads(status);
create index if not exists idx_email_threads_external_thread_id
  on crm_email_threads(external_thread_id);
