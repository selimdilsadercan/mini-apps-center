CREATE SCHEMA IF NOT EXISTS business_page;

CREATE TABLE IF NOT EXISTS business_page.links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES business.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT, -- Phosphor icon name
    sort_order INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_page_links_business ON business_page.links(business_id);

GRANT ALL ON SCHEMA business_page TO anon, authenticated, service_role;
GRANT ALL ON TABLE business_page.links TO anon, authenticated, service_role;
