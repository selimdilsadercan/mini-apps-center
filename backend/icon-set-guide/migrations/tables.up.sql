--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (clerk_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'icon_set_guide' AND table_name = 'favorites' AND column_name = 'clerk_id') THEN
        -- Add user_id if not exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'icon_set_guide' AND table_name = 'favorites' AND column_name = 'user_id') THEN
            ALTER TABLE icon_set_guide.favorites ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        -- Migrate data
        UPDATE icon_set_guide.favorites f
        SET user_id = u.id
        FROM public.users u
        WHERE f.clerk_id = u.clerk_id OR f.clerk_id = u.local_clerk_id;

        -- Drop old column
        ALTER TABLE icon_set_guide.favorites DROP COLUMN clerk_id;
        
        -- Add unique constraint back
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorites_user_id_icon_set_id_key') THEN
            ALTER TABLE icon_set_guide.favorites ADD CONSTRAINT favorites_user_id_icon_set_id_key UNIQUE (user_id, icon_set_id);
        END IF;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS icon_set_guide;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA icon_set_guide TO anon, authenticated, service_role;

-- 2. Icon Sets Table
CREATE TABLE IF NOT EXISTS icon_set_guide.icon_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    license TEXT NOT NULL,
    frameworks TEXT[] NOT NULL DEFAULT '{}',
    styles TEXT[] NOT NULL DEFAULT '{}',
    best_for TEXT[] NOT NULL DEFAULT '{}',
    vibes TEXT[] NOT NULL DEFAULT '{}',
    website_url TEXT NOT NULL,
    github_url TEXT,
    npm_command TEXT,
    detailed_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Favorites Table
CREATE TABLE IF NOT EXISTS icon_set_guide.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    icon_set_id TEXT NOT NULL REFERENCES icon_set_guide.icon_sets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, icon_set_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_icon_sets_guide_fav_user ON icon_set_guide.favorites(user_id);

-- 5. Grants
GRANT ALL ON ALL TABLES IN SCHEMA icon_set_guide TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA icon_set_guide TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA icon_set_guide GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA icon_set_guide GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA icon_set_guide GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
