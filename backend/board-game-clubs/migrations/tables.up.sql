--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS board_game_clubs;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA board_game_clubs TO anon, authenticated, service_role;

-- 2. Clubs Table
CREATE TABLE IF NOT EXISTS board_game_clubs.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Games Table
CREATE TABLE IF NOT EXISTS board_game_clubs.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES board_game_clubs.clubs(id) ON DELETE CASCADE,
  bgg_id INTEGER,
  title TEXT NOT NULL,
  image_url TEXT,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER,
  description TEXT,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'good', 'worn', 'damaged')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_bgc_clubs_owner ON board_game_clubs.clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_bgc_games_club ON board_game_clubs.games(club_id);

-- 5. Grants
GRANT ALL ON ALL TABLES IN SCHEMA board_game_clubs TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA board_game_clubs TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA board_game_clubs GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA board_game_clubs GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA board_game_clubs GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
