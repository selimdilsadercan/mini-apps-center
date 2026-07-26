--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Initial Setup
-- Handled directly in Ideal State below

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- Create Schema
CREATE SCHEMA IF NOT EXISTS outdoor_activities;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA outdoor_activities TO anon, authenticated, service_role;

-- 1. Venues Table
CREATE TABLE IF NOT EXISTS outdoor_activities.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- horse-riding, canoeing, skiing, camping, lasertag, paintball, diving, gokart
    city TEXT NOT NULL,
    district TEXT,
    address TEXT,
    notes TEXT,
    rating NUMERIC CHECK (rating >= 1 AND rating <= 5),
    website_url TEXT,
    image_url TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_outdoor_venues_category ON outdoor_activities.venues(category);
CREATE INDEX IF NOT EXISTS idx_outdoor_venues_city ON outdoor_activities.venues(city);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA outdoor_activities TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA outdoor_activities TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA outdoor_activities GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA outdoor_activities GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA outdoor_activities GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
