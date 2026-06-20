--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- 2026-06-20: Created initial business schema and central businesses table.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS business;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA business TO anon, authenticated, service_role;

-- 2. Businesses Table
CREATE TABLE IF NOT EXISTS business.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    theme_color TEXT DEFAULT '#EF4444' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON business.businesses(owner_user_id);

-- 4. Grants & Permissions
GRANT ALL ON ALL TABLES IN SCHEMA business TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA business TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA business GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA business GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA business GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
