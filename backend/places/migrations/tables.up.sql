--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- 2026-07-27: Created initial schema for places application.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS places;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA places TO anon, authenticated, service_role;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS places.places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'Kafe', 'Restoran', 'Tatlıcı', 'Bar'
    address TEXT,
    district TEXT,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    image_url TEXT,
    rating NUMERIC(2, 1) DEFAULT 4.5 NOT NULL,
    working_hours TEXT,
    features TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    business_id TEXT REFERENCES business.businesses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS places.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES places.places(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, place_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_places_category ON places.places(category);
CREATE INDEX IF NOT EXISTS idx_places_district ON places.places(district);
CREATE INDEX IF NOT EXISTS idx_places_business_id ON places.places(business_id);
CREATE INDEX IF NOT EXISTS idx_places_favorites_user ON places.user_favorites(user_id);

-- 4. Grants & Permissions
GRANT ALL ON ALL TABLES IN SCHEMA places TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA places TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA places GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA places GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA places GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
