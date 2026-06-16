--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (created_by TEXT -> creator_id UUID)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'memedex' AND table_name = 'memes' AND column_name = 'created_by') THEN
        -- Add creator_id if not exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'memedex' AND table_name = 'memes' AND column_name = 'creator_id') THEN
            ALTER TABLE memedex.memes ADD COLUMN creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;

        -- Migrate data
        UPDATE memedex.memes m
        SET creator_id = u.id
        FROM public.users u
        WHERE m.created_by = u.clerk_id OR m.created_by = u.local_clerk_id;

        -- Drop old column
        ALTER TABLE memedex.memes DROP COLUMN created_by;
    END IF;
END $$;

-- 2. Migration: Add Likes table for user-specific tracking
CREATE TABLE IF NOT EXISTS memedex.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meme_id UUID NOT NULL REFERENCES memedex.memes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, meme_id)
);

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS memedex;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA memedex TO anon, authenticated, service_role;

-- 2. Memes Table
CREATE TABLE IF NOT EXISTS memedex.memes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '' NOT NULL,
    context TEXT DEFAULT '' NOT NULL,
    example TEXT DEFAULT '' NOT NULL,
    trend_status TEXT NOT NULL, -- 'Trending', 'Classic', 'Dead'
    media_url TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}' NOT NULL,
    likes_count INT DEFAULT 0 NOT NULL,
    creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    parent_id UUID REFERENCES memedex.memes(id) ON DELETE CASCADE
);

-- 3. Likes Table
CREATE TABLE IF NOT EXISTS memedex.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meme_id UUID NOT NULL REFERENCES memedex.memes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, meme_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_memedex_memes_title ON memedex.memes(title);
CREATE INDEX IF NOT EXISTS idx_memedex_memes_likes ON memedex.memes(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_memedex_memes_parent_id ON memedex.memes(parent_id);
CREATE INDEX IF NOT EXISTS idx_memedex_likes_user_id ON memedex.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_memedex_likes_meme_id ON memedex.likes(meme_id);

-- 5. Grants
GRANT ALL ON ALL TABLES IN SCHEMA memedex TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA memedex TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA memedex GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA memedex GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA memedex GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
