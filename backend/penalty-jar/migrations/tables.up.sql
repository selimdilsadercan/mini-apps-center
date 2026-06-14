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
    -- lobbies table: creator_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'penalty_jar' AND table_name = 'lobbies' AND column_name = 'creator_id' AND data_type = 'text') THEN
        ALTER TABLE penalty_jar.lobbies RENAME COLUMN creator_id TO creator_id_old;
        ALTER TABLE penalty_jar.lobbies ADD COLUMN creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        UPDATE penalty_jar.lobbies l SET creator_id = u.id FROM public.users u WHERE l.creator_id_old = u.clerk_id OR l.creator_id_old = u.local_clerk_id;
        DELETE FROM penalty_jar.lobbies WHERE creator_id IS NULL;
        ALTER TABLE penalty_jar.lobbies DROP COLUMN creator_id_old;
        ALTER TABLE penalty_jar.lobbies ALTER COLUMN creator_id SET NOT NULL;
    END IF;

    -- lobby_members table: user_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'penalty_jar' AND table_name = 'lobby_members' AND column_name = 'user_id' AND data_type = 'text') THEN
        ALTER TABLE penalty_jar.lobby_members RENAME COLUMN user_id TO user_id_old;
        ALTER TABLE penalty_jar.lobby_members ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        UPDATE penalty_jar.lobby_members lm SET user_id = u.id FROM public.users u WHERE lm.user_id_old = u.clerk_id OR lm.user_id_old = u.local_clerk_id;
        DELETE FROM penalty_jar.lobby_members WHERE user_id IS NULL;
        ALTER TABLE penalty_jar.lobby_members DROP COLUMN user_id_old;
        ALTER TABLE penalty_jar.lobby_members ADD PRIMARY KEY (lobby_id, user_id);
    END IF;

    -- infractions table: reported_user_id, reporter_user_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'penalty_jar' AND table_name = 'infractions' AND column_name = 'reported_user_id' AND data_type = 'text') THEN
        ALTER TABLE penalty_jar.infractions RENAME COLUMN reported_user_id TO reported_user_id_old;
        ALTER TABLE penalty_jar.infractions RENAME COLUMN reporter_user_id TO reporter_user_id_old;
        ALTER TABLE penalty_jar.infractions ADD COLUMN reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        ALTER TABLE penalty_jar.infractions ADD COLUMN reporter_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        UPDATE penalty_jar.infractions i SET reported_user_id = u.id FROM public.users u WHERE i.reported_user_id_old = u.clerk_id OR i.reported_user_id_old = u.local_clerk_id;
        UPDATE penalty_jar.infractions i SET reporter_user_id = u.id FROM public.users u WHERE i.reporter_user_id_old = u.clerk_id OR i.reporter_user_id_old = u.local_clerk_id;
        
        DELETE FROM penalty_jar.infractions WHERE reported_user_id IS NULL;
        ALTER TABLE penalty_jar.infractions DROP COLUMN reported_user_id_old;
        ALTER TABLE penalty_jar.infractions DROP COLUMN reporter_user_id_old;
        ALTER TABLE penalty_jar.infractions ALTER COLUMN reported_user_id SET NOT NULL;
    END IF;

    -- votes table: user_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'penalty_jar' AND table_name = 'votes' AND column_name = 'user_id' AND data_type = 'text') THEN
        ALTER TABLE penalty_jar.votes RENAME COLUMN user_id TO user_id_old;
        ALTER TABLE penalty_jar.votes ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        UPDATE penalty_jar.votes v SET user_id = u.id FROM public.users u WHERE v.user_id_old = u.clerk_id OR v.user_id_old = u.local_clerk_id;
        DELETE FROM penalty_jar.votes WHERE user_id IS NULL;
        ALTER TABLE penalty_jar.votes DROP COLUMN user_id_old;
        ALTER TABLE penalty_jar.votes ADD PRIMARY KEY (infraction_id, user_id);
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS penalty_jar;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA penalty_jar TO anon, authenticated, service_role;

-- 2. Lobbies Table
CREATE TABLE IF NOT EXISTS penalty_jar.lobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    join_code TEXT UNIQUE NOT NULL,
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    penalty_type TEXT NOT NULL CHECK (penalty_type IN ('points', 'jar')) DEFAULT 'points',
    currency TEXT NOT NULL DEFAULT 'TL',
    point_start INT NOT NULL DEFAULT 100,
    penalty_amount NUMERIC NOT NULL DEFAULT 10,
    rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Lobby Members Table
CREATE TABLE IF NOT EXISTS penalty_jar.lobby_members (
    lobby_id UUID NOT NULL REFERENCES penalty_jar.lobbies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    points INT NOT NULL DEFAULT 100,
    money_owed NUMERIC NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (lobby_id, user_id)
);

-- 4. Infractions Table
CREATE TABLE IF NOT EXISTS penalty_jar.infractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID NOT NULL REFERENCES penalty_jar.lobbies(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reporter_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    penalty_amount NUMERIC NOT NULL,
    is_self_report BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Votes Table
CREATE TABLE IF NOT EXISTS penalty_jar.votes (
    infraction_id UUID NOT NULL REFERENCES penalty_jar.infractions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    approve BOOLEAN NOT NULL,
    voted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (infraction_id, user_id)
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_pj_lobbies_code ON penalty_jar.lobbies(join_code);
CREATE INDEX IF NOT EXISTS idx_pj_members_user ON penalty_jar.lobby_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pj_members_lobby ON penalty_jar.lobby_members(lobby_id);
CREATE INDEX IF NOT EXISTS idx_pj_infractions_lobby ON penalty_jar.infractions(lobby_id);
CREATE INDEX IF NOT EXISTS idx_pj_votes_infraction ON penalty_jar.votes(infraction_id);

-- 7. Grants
GRANT ALL ON ALL TABLES IN SCHEMA penalty_jar TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA penalty_jar TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA penalty_jar GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA penalty_jar GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA penalty_jar GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
