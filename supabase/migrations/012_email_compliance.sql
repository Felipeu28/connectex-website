-- Migration 012: Email compliance and tracking
-- Adds unsubscribe tokens, opt-out registry, and per-email send/open/click events
-- for both campaigns and sequence sends.

-- ─── Per-contact unsubscribe token ──────────────────────────────────────────
-- We need a stable per-contact token (not per-send) so a single click
-- opts out the contact from all future emails.

ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- Backfill tokens for existing contacts that don't have one
UPDATE crm_contacts SET unsubscribe_token = gen_random_uuid() WHERE unsubscribe_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_unsubscribe_token_idx
  ON crm_contacts(unsubscribe_token);

CREATE INDEX IF NOT EXISTS crm_contacts_unsubscribed_idx
  ON crm_contacts(unsubscribed) WHERE unsubscribed = TRUE;

-- ─── Email events (open/click/bounce/complaint) ─────────────────────────────
-- Single table for Resend webhook events tied to either a campaign send or a
-- sequence send.

CREATE TABLE IF NOT EXISTS email_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL CHECK (event_type IN (
    'sent', 'delivered', 'opened', 'clicked',
    'bounced', 'complained', 'failed', 'unsubscribed'
  )),
  email         TEXT NOT NULL,
  contact_id    UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  campaign_id   UUID REFERENCES crm_campaigns(id) ON DELETE SET NULL,
  sequence_id   UUID REFERENCES crm_sequences(id) ON DELETE SET NULL,
  send_id       TEXT,                -- Resend message id
  link_url      TEXT,                -- For click events
  user_agent    TEXT,
  ip_address    TEXT,
  raw           JSONB,               -- Full webhook payload for debugging
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_events_contact_idx ON email_events(contact_id);
CREATE INDEX IF NOT EXISTS email_events_campaign_idx ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS email_events_send_idx ON email_events(send_id);
CREATE INDEX IF NOT EXISTS email_events_type_created_idx ON email_events(event_type, created_at DESC);

ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_email_events" ON email_events;
CREATE POLICY "service_role_all_email_events"
  ON email_events FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "auth_read_email_events" ON email_events;
CREATE POLICY "auth_read_email_events"
  ON email_events FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─── click_count and open_count exist on crm_campaigns already (002_crm.sql)
-- We populate them from email_events via the webhook handler.

-- ─── Add resend_message_id to crm_sequence_sends for webhook correlation
ALTER TABLE crm_sequence_sends
  ADD COLUMN IF NOT EXISTS resend_message_id TEXT;

CREATE INDEX IF NOT EXISTS crm_sequence_sends_resend_id_idx
  ON crm_sequence_sends(resend_message_id);
