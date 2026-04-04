-- Create Supabase Storage bucket for ticket attachments
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-attachments',
  'ticket-attachments',
  true,
  10485760, -- 10MB limit
  array['image/jpeg','image/png','image/gif','image/webp','image/heic','application/pdf']
)
on conflict (id) do nothing;

-- Allow anyone to upload (clients submit without login)
create policy "anon_upload_ticket_attachments"
  on storage.objects for insert
  with check (bucket_id = 'ticket-attachments');

-- Allow anyone to read (public bucket, but policy required)
create policy "public_read_ticket_attachments"
  on storage.objects for select
  using (bucket_id = 'ticket-attachments');
