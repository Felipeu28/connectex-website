-- Migration 009: Client portal auth, AI chat, and knowledge base foundation
-- Run this in Supabase SQL editor (Dashboard > SQL Editor > New query)

-- ─── Ticket enhancements ────────────────────────────────────────────────────

-- Link tickets to Supabase auth users (set on first portal login or when ticket created while authenticated)
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- AI chat tracking fields
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS ai_confidence INTEGER,
  ADD COLUMN IF NOT EXISTS ai_category TEXT,
  ADD COLUMN IF NOT EXISTS human_took_over BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS human_took_over_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS tickets_user_id_idx ON tickets(user_id);
CREATE INDEX IF NOT EXISTS tickets_human_took_over_idx ON tickets(human_took_over);

-- ─── ticket_messages: add 'ai' as a valid sender type ───────────────────────

-- Drop the existing CHECK constraint and recreate with 'ai' included
ALTER TABLE ticket_messages
  DROP CONSTRAINT IF EXISTS ticket_messages_sender_type_check;

ALTER TABLE ticket_messages
  ADD CONSTRAINT ticket_messages_sender_type_check
  CHECK (sender_type IN ('client', 'admin', 'ai'));

-- ─── Client product inventory ───────────────────────────────────────────────
-- Allows Mark to assign devices/products to client email addresses.
-- Portal dashboard surfaces these on login; AI triage pre-loads as context.

CREATE TABLE IF NOT EXISTS client_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id    UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  client_email  TEXT NOT NULL,
  device_type   TEXT NOT NULL,         -- 'router', 'phone', 'desk_phone', 'laptop', etc.
  manufacturer  TEXT,                  -- 'Verizon', 'Yealink', 'Polycom', 'Apple', etc.
  model         TEXT NOT NULL,         -- 'T77', 'VVX 400', 'iPhone 15 Pro', etc.
  serial_number TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_products_email_idx ON client_products(client_email);
CREATE INDEX IF NOT EXISTS client_products_contact_idx ON client_products(contact_id);

-- RLS: allow service role full access; anon can read for portal display
ALTER TABLE client_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "service_role_all_client_products"
  ON client_products FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "anon_read_own_client_products"
  ON client_products FOR SELECT
  USING (true);  -- Portal queries by email after session check in app layer

-- ─── Knowledge base documents ───────────────────────────────────────────────
-- Mark uploads PDF/docs here. AI triage + chat queries by category.

CREATE TABLE IF NOT EXISTS kb_documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  category   TEXT NOT NULL CHECK (category IN ('verizon', 'microsoft365', 'ucaas', 'general')),
  file_url   TEXT,                     -- Supabase Storage URL (kb-documents bucket)
  file_name  TEXT,
  content    TEXT,                     -- Extracted text content for Gemini context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kb_documents_category_idx ON kb_documents(category);

ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "service_role_all_kb_documents"
  ON kb_documents FOR ALL
  USING (auth.role() = 'service_role');

-- ─── Storage bucket for knowledge base uploads ──────────────────────────────
-- Run this separately in Storage settings if the SQL insert doesn't work:
-- Create bucket named "kb-documents" with public: false, max file size: 20MB

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kb-documents',
  'kb-documents',
  false,
  20971520,  -- 20MB
  ARRAY['application/pdf', 'text/plain', 'text/markdown',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: service role can upload/read/delete
CREATE POLICY IF NOT EXISTS "service_role_kb_upload"
  ON storage.objects FOR ALL
  USING (bucket_id = 'kb-documents' AND auth.role() = 'service_role');
