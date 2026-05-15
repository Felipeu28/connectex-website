-- Migration 011: Preferred partners directory
-- Lets Mark manage preferred local partners via CRM and surface them on /partners.

CREATE TABLE IF NOT EXISTS partners (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,                  -- 'IT', 'Cybersecurity', 'Cloud', 'Voice', etc.
  description  TEXT,                            -- Short blurb shown on /partners
  website      TEXT,                            -- Optional URL
  contact_email TEXT,
  contact_phone TEXT,
  logo_url     TEXT,                            -- Optional logo from kb-documents or partners bucket
  color        TEXT DEFAULT '#00C9A7',          -- Accent color shown on card
  featured     BOOLEAN DEFAULT FALSE,           -- Pin to top of public list
  visible      BOOLEAN DEFAULT TRUE,            -- Hide without deleting
  sort_order   INTEGER DEFAULT 0,               -- Lower = earlier (used with featured)
  notes        TEXT,                            -- Internal notes (not shown publicly)
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS partners_visible_idx ON partners(visible, sort_order);
CREATE INDEX IF NOT EXISTS partners_featured_idx ON partners(featured) WHERE featured = TRUE;

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Service role has full access (CRM admin client)
DROP POLICY IF EXISTS "service_role_all_partners" ON partners;
CREATE POLICY "service_role_all_partners"
  ON partners FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated CRM users have full access
DROP POLICY IF EXISTS "auth_full_access_partners" ON partners;
CREATE POLICY "auth_full_access_partners"
  ON partners FOR ALL
  USING (auth.role() = 'authenticated');

-- Anon can read visible partners (for public /partners page)
DROP POLICY IF EXISTS "anon_read_visible_partners" ON partners;
CREATE POLICY "anon_read_visible_partners"
  ON partners FOR SELECT
  USING (visible = TRUE);
