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
    -- concert_list.concerts: user_clerk_id -> user_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'concert_list' AND table_name = 'concerts' AND column_name = 'user_clerk_id') THEN
        ALTER TABLE concert_list.concerts RENAME COLUMN user_clerk_id TO user_clerk_id_old;
        ALTER TABLE concert_list.concerts ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        UPDATE concert_list.concerts c
        SET user_id = u.id
        FROM public.users u
        WHERE c.user_clerk_id_old = u.clerk_id OR c.user_clerk_id_old = u.local_clerk_id;
        
        ALTER TABLE concert_list.concerts DROP COLUMN user_clerk_id_old;
    END IF;

    -- concert_list.concert_friends: friend_clerk_id -> friend_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'concert_list' AND table_name = 'concert_friends' AND column_name = 'friend_clerk_id') THEN
        ALTER TABLE concert_list.concert_friends RENAME COLUMN friend_clerk_id TO friend_clerk_id_old;
        ALTER TABLE concert_list.concert_friends ADD COLUMN friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        UPDATE concert_list.concert_friends cf
        SET friend_id = u.id
        FROM public.users u
        WHERE cf.friend_clerk_id_old = u.clerk_id OR cf.friend_clerk_id_old = u.local_clerk_id;
        
        ALTER TABLE concert_list.concert_friends DROP COLUMN friend_clerk_id_old;
        
        -- Add primary key back
        ALTER TABLE concert_list.concert_friends ADD PRIMARY KEY (concert_id, friend_id);
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS concert_list;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA concert_list TO anon, authenticated, service_role;

-- 2. Concerts Table
CREATE TABLE IF NOT EXISTS concert_list.concerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    artist TEXT NOT NULL,
    date DATE NOT NULL,
    venue TEXT,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Concert Friends Table
CREATE TABLE IF NOT EXISTS concert_list.concert_friends (
    concert_id UUID NOT NULL REFERENCES concert_list.concerts(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (concert_id, friend_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_concerts_user_id ON concert_list.concerts(user_id);
CREATE INDEX IF NOT EXISTS idx_concerts_date ON concert_list.concerts(date);
CREATE INDEX IF NOT EXISTS idx_concert_friends_concert_id ON concert_list.concert_friends(concert_id);

-- 5. Grants
GRANT ALL ON ALL TABLES IN SCHEMA concert_list TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA concert_list TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA concert_list GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA concert_list GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA concert_list GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
