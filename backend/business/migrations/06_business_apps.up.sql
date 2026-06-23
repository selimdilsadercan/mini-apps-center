-- 06_business_apps.up.sql

-- 1. Create Business Apps Table
CREATE TABLE IF NOT EXISTS business.business_apps (
    business_id TEXT NOT NULL REFERENCES business.businesses(id) ON DELETE CASCADE,
    app_id TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (business_id, app_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_business_apps_business ON business.business_apps(business_id);

-- 3. Grants
GRANT ALL ON TABLE business.business_apps TO anon, authenticated, service_role;
