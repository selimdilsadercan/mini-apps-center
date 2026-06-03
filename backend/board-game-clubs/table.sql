-- BoardGameClubs Schema
CREATE SCHEMA IF NOT EXISTS board_game_clubs;

-- Clubs Table
CREATE TABLE IF NOT EXISTS board_game_clubs.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Games Table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bgc_clubs_owner ON board_game_clubs.clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_bgc_games_club ON board_game_clubs.games(club_id);

-- Grants
GRANT USAGE ON SCHEMA board_game_clubs TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA board_game_clubs TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA board_game_clubs TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA board_game_clubs TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA board_game_clubs GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA board_game_clubs GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA board_game_clubs GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
