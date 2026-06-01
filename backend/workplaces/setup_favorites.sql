-- ============================================================
-- WORKPLACES FAVORITES — run this ENTIRE file in Supabase SQL Editor
-- Do NOT run functions/get_favorite_place_ids.sql by itself.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS workplaces;

-- places must exist (skip if you already ran 01_init)
CREATE TABLE IF NOT EXISTS workplaces.places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    note TEXT,
    url TEXT,
    tags TEXT[] DEFAULT '{}',
    wifi BOOLEAN DEFAULT FALSE,
    parking BOOLEAN DEFAULT FALSE,
    power_outlets BOOLEAN DEFAULT FALSE,
    quiet_level INTEGER DEFAULT 3,
    suggested_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- favorites table
CREATE TABLE IF NOT EXISTS workplaces.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES workplaces.places(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (place_id, clerk_id)
);

CREATE INDEX IF NOT EXISTS idx_workplaces_favorites_clerk_id ON workplaces.favorites(clerk_id);
CREATE INDEX IF NOT EXISTS idx_workplaces_favorites_place_id ON workplaces.favorites(place_id);

GRANT USAGE ON SCHEMA workplaces TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA workplaces TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA workplaces TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA workplaces TO anon, authenticated, service_role;
GRANT ALL ON workplaces.favorites TO anon, authenticated, service_role;

-- Verify table exists before creating functions
DO $$
BEGIN
  IF to_regclass('workplaces.favorites') IS NULL THEN
    RAISE EXCEPTION 'workplaces.favorites was not created. Check errors above.';
  END IF;
END $$;

DROP FUNCTION IF EXISTS workplaces.toggle_favorite(UUID, TEXT);

CREATE OR REPLACE FUNCTION workplaces.toggle_favorite(
    p_place_id UUID,
    p_clerk_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = workplaces, public
AS $$
DECLARE
    exists_val BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM workplaces.favorites
        WHERE place_id = p_place_id AND clerk_id = p_clerk_id
    ) INTO exists_val;

    IF exists_val THEN
        DELETE FROM workplaces.favorites
        WHERE place_id = p_place_id AND clerk_id = p_clerk_id;
        RETURN FALSE;
    END IF;

    INSERT INTO workplaces.favorites (place_id, clerk_id)
    VALUES (p_place_id, p_clerk_id);
    RETURN TRUE;
END;
$$;

DROP FUNCTION IF EXISTS workplaces.get_favorite_place_ids(TEXT);

CREATE OR REPLACE FUNCTION workplaces.get_favorite_place_ids(p_clerk_id TEXT)
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = workplaces, public
AS $$
BEGIN
    RETURN QUERY
    SELECT f.place_id
    FROM workplaces.favorites f
    WHERE f.clerk_id = p_clerk_id;
END;
$$;

-- 4) Visited (Gittim)
CREATE TABLE IF NOT EXISTS workplaces.visited (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES workplaces.places(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (place_id, clerk_id)
);

CREATE INDEX IF NOT EXISTS idx_workplaces_visited_clerk_id ON workplaces.visited(clerk_id);
CREATE INDEX IF NOT EXISTS idx_workplaces_visited_place_id ON workplaces.visited(place_id);

GRANT ALL ON workplaces.visited TO anon, authenticated, service_role;

-- Should list favorites + visited
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'workplaces' AND table_name IN ('favorites', 'visited');
