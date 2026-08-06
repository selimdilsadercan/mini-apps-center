--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- 2026-08-06: Initial schema creation for kaydedilenler app.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS kaydedilenler;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA kaydedilenler TO anon, authenticated, service_role;

-- 2. Create Bookmarks Table
CREATE TABLE IF NOT EXISTS kaydedilenler.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    image_url TEXT,
    category TEXT NOT NULL, -- 'Mekan', 'Tarif', 'Alışveriş', 'Genel', 'Diğer'
    instagram_username TEXT,
    -- Place specific columns (nullable)
    city TEXT,
    district TEXT,
    rating NUMERIC(2, 1),
    is_visited BOOLEAN DEFAULT FALSE NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_kaydedilenler_bookmarks_user ON kaydedilenler.bookmarks(created_user_id);
CREATE INDEX IF NOT EXISTS idx_kaydedilenler_bookmarks_category ON kaydedilenler.bookmarks(category);

-- 4. Grants & Permissions
GRANT ALL ON ALL TABLES IN SCHEMA kaydedilenler TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kaydedilenler TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kaydedilenler GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kaydedilenler GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kaydedilenler GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
