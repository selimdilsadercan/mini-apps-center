--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- 2026-06-22: Created initial yazboz schema, players and game_saves tables.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS yazboz;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA yazboz TO anon, authenticated, service_role;

-- 2. Players Table
CREATE TABLE IF NOT EXISTS yazboz.players (
    id TEXT PRIMARY KEY DEFAULT substring(md5(random()::text), 1, 8),
    owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    initial TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Game Saves Table
CREATE TABLE IF NOT EXISTS yazboz.game_saves (
    id TEXT PRIMARY KEY DEFAULT substring(md5(random()::text), 1, 8),
    owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    game_template TEXT NOT NULL,
    players JSONB NOT NULL,
    settings JSONB NOT NULL,
    state JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_yazboz_players_owner ON yazboz.players(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_yazboz_game_saves_owner ON yazboz.game_saves(owner_user_id);

-- 5. Grants & Permissions
GRANT ALL ON ALL TABLES IN SCHEMA yazboz TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA yazboz TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA yazboz GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA yazboz GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA yazboz GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
