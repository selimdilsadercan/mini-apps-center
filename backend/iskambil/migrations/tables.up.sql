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
    -- favorites table
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'iskambil' AND table_name = 'favorites' AND column_name = 'clerk_id') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'iskambil' AND table_name = 'favorites' AND column_name = 'user_id') THEN
            ALTER TABLE iskambil.favorites ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;
        UPDATE iskambil.favorites f SET user_id = u.id FROM public.users u WHERE f.clerk_id = u.clerk_id OR f.clerk_id = u.local_clerk_id;
        ALTER TABLE iskambil.favorites DROP COLUMN clerk_id;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorites_user_id_game_id_key') THEN
            ALTER TABLE iskambil.favorites ADD CONSTRAINT favorites_user_id_game_id_key UNIQUE (user_id, game_id);
        END IF;
    END IF;

    -- notes table
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'iskambil' AND table_name = 'notes' AND column_name = 'clerk_id') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'iskambil' AND table_name = 'notes' AND column_name = 'user_id') THEN
            ALTER TABLE iskambil.notes ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;
        UPDATE iskambil.notes n SET user_id = u.id FROM public.users u WHERE n.clerk_id = u.clerk_id OR n.clerk_id = u.local_clerk_id;
        ALTER TABLE iskambil.notes DROP COLUMN clerk_id;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notes_user_id_game_id_key') THEN
            ALTER TABLE iskambil.notes ADD CONSTRAINT notes_user_id_game_id_key UNIQUE (user_id, game_id);
        END IF;
    END IF;

    -- known_games table
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'iskambil' AND table_name = 'known_games' AND column_name = 'clerk_id') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'iskambil' AND table_name = 'known_games' AND column_name = 'user_id') THEN
            ALTER TABLE iskambil.known_games ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;
        UPDATE iskambil.known_games k SET user_id = u.id FROM public.users u WHERE k.clerk_id = u.clerk_id OR k.clerk_id = u.local_clerk_id;
        ALTER TABLE iskambil.known_games DROP COLUMN clerk_id;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'known_games_user_id_game_id_key') THEN
            ALTER TABLE iskambil.known_games ADD CONSTRAINT known_games_user_id_game_id_key UNIQUE (user_id, game_id);
        END IF;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS iskambil;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA iskambil TO anon, authenticated, service_role;

-- 2. Favorites Table
CREATE TABLE IF NOT EXISTS iskambil.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, game_id)
);

-- 3. Notes Table
CREATE TABLE IF NOT EXISTS iskambil.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    note TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, game_id)
);

-- 4. Known Games Table
CREATE TABLE IF NOT EXISTS iskambil.known_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, game_id)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_iskambil_favorites_user_id ON iskambil.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_iskambil_notes_user_id ON iskambil.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_iskambil_known_games_user_id ON iskambil.known_games(user_id);

-- 6. Grants
GRANT ALL ON ALL TABLES IN SCHEMA iskambil TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA iskambil TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
