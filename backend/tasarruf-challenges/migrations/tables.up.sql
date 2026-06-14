--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------

-- 1. Migration: user_id TEXT -> UUID Transition
DO $$ 
BEGIN 
    -- Check if user_id is still TEXT in tasarruf_challenges.posts
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'tasarruf_challenges' 
          AND table_name = 'posts' 
          AND column_name = 'user_id' 
          AND data_type = 'text'
    ) THEN
        -- 1. Rename old column
        ALTER TABLE tasarruf_challenges.posts RENAME COLUMN user_id TO user_id_old;
        
        -- 2. Add new UUID column
        ALTER TABLE tasarruf_challenges.posts ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        -- 3. Migrate data
        UPDATE tasarruf_challenges.posts p
        SET user_id = u.id
        FROM public.users u
        WHERE p.user_id_old = u.clerk_id OR p.user_id_old = u.local_clerk_id;
        
        -- 4. Delete orphaned rows (where user couldn't be matched)
        DELETE FROM tasarruf_challenges.posts WHERE user_id IS NULL;
        
        -- 5. Set NOT NULL and drop old column
        ALTER TABLE tasarruf_challenges.posts ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE tasarruf_challenges.posts DROP COLUMN user_id_old;

        -- 6. Re-create index
        CREATE INDEX IF NOT EXISTS idx_tasarruf_challenges_posts_user_id ON tasarruf_challenges.posts(user_id);
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS tasarruf_challenges;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA tasarruf_challenges TO anon, authenticated, service_role;

-- 2. Posts Table
CREATE TABLE IF NOT EXISTS tasarruf_challenges.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_image TEXT,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) DEFAULT 0,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_tasarruf_challenges_posts_user_id ON tasarruf_challenges.posts(user_id);

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tasarruf_challenges TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA tasarruf_challenges GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasarruf_challenges GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasarruf_challenges GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
