--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition & User-Specific Lists
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'map_tracker' AND table_name = 'lists') THEN
        -- Check if user_id column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'map_tracker' AND table_name = 'lists' AND column_name = 'user_id') THEN
            -- Add user_id column
            ALTER TABLE map_tracker.lists ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
            
            -- Remove global unique constraint on name
            ALTER TABLE map_tracker.lists DROP CONSTRAINT IF EXISTS lists_name_key;
            
            -- Since it was global, we'll clear it to start fresh with user-specific data
            DELETE FROM map_tracker.items;
            DELETE FROM map_tracker.lists;
            
            -- Now make user_id NOT NULL
            ALTER TABLE map_tracker.lists ALTER COLUMN user_id SET NOT NULL;
            
            -- Add new unique constraint
            ALTER TABLE map_tracker.lists ADD CONSTRAINT lists_user_id_name_key UNIQUE (user_id, name);
        END IF;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS map_tracker;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA map_tracker TO anon, authenticated, service_role;

-- 2. Lists Table
CREATE TABLE IF NOT EXISTS map_tracker.lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, name)
);

-- 3. Items Table
CREATE TABLE IF NOT EXISTS map_tracker.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES map_tracker.lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    google_maps_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_visited BOOLEAN DEFAULT FALSE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    UNIQUE(list_id, name)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_map_tracker_lists_user_id ON map_tracker.lists(user_id);
CREATE INDEX IF NOT EXISTS idx_map_tracker_items_list_id ON map_tracker.items(list_id);
CREATE INDEX IF NOT EXISTS idx_map_tracker_items_is_visited ON map_tracker.items(is_visited);

-- 5. Grants
GRANT ALL ON ALL TABLES IN SCHEMA map_tracker TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA map_tracker TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA map_tracker GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA map_tracker GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA map_tracker GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
