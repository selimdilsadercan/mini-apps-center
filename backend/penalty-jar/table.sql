-- Penalty Jar Schema
CREATE SCHEMA IF NOT EXISTS penalty_jar;

-- Lobbies Table
CREATE TABLE IF NOT EXISTS penalty_jar.lobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    join_code TEXT UNIQUE NOT NULL,
    creator_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    penalty_type TEXT NOT NULL CHECK (penalty_type IN ('points', 'jar')) DEFAULT 'points',
    currency TEXT NOT NULL DEFAULT 'TL',
    point_start INT NOT NULL DEFAULT 100,
    penalty_amount NUMERIC NOT NULL DEFAULT 10,
    rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lobby Members Table
CREATE TABLE IF NOT EXISTS penalty_jar.lobby_members (
    lobby_id UUID NOT NULL REFERENCES penalty_jar.lobbies(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    points INT NOT NULL DEFAULT 100,
    money_owed NUMERIC NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (lobby_id, user_id)
);

-- Infractions Table
CREATE TABLE IF NOT EXISTS penalty_jar.infractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID NOT NULL REFERENCES penalty_jar.lobbies(id) ON DELETE CASCADE,
    reported_user_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    reporter_user_id TEXT REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    penalty_amount NUMERIC NOT NULL,
    is_self_report BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes Table
CREATE TABLE IF NOT EXISTS penalty_jar.votes (
    infraction_id UUID NOT NULL REFERENCES penalty_jar.infractions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    approve BOOLEAN NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (infraction_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pj_lobbies_code ON penalty_jar.lobbies(join_code);
CREATE INDEX IF NOT EXISTS idx_pj_members_user ON penalty_jar.lobby_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pj_members_lobby ON penalty_jar.lobby_members(lobby_id);
CREATE INDEX IF NOT EXISTS idx_pj_infractions_lobby ON penalty_jar.infractions(lobby_id);
CREATE INDEX IF NOT EXISTS idx_pj_votes_infraction ON penalty_jar.votes(infraction_id);

-- Permissions (Grants)
GRANT USAGE ON SCHEMA penalty_jar TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA penalty_jar TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA penalty_jar TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA penalty_jar TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA penalty_jar GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA penalty_jar GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA penalty_jar GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
