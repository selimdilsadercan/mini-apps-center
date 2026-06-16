--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS tournament;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA tournament TO anon, authenticated, service_role;

-- 2. Tournaments Table
CREATE TABLE IF NOT EXISTS tournament.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, active, completed
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  capacity INTEGER DEFAULT 16,
  advance_count INTEGER DEFAULT 4,
  current_league_round INTEGER DEFAULT 1,
  league_match_count INTEGER DEFAULT 3,
  format TEXT DEFAULT 'league_knockout',
  players_per_match INTEGER DEFAULT 2,
  start_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Participants Table
CREATE TABLE IF NOT EXISTS tournament.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournament.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Nullable for mock players
  username TEXT NOT NULL,
  avatar TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_manual BOOLEAN DEFAULT FALSE,
  avoid_list TEXT[] DEFAULT '{}',
  is_present BOOLEAN DEFAULT FALSE,
  UNIQUE(tournament_id, user_id)
);

-- 4. Matches Table
CREATE TABLE IF NOT EXISTS tournament.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournament.tournaments(id) ON DELETE CASCADE,
  phase TEXT NOT NULL, -- 'league' or 'bracket'
  round INTEGER NOT NULL DEFAULT 1,
  player1_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL,
  player3_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL,
  player4_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL,
  scores JSONB DEFAULT '{}',
  status TEXT DEFAULT 'upcoming', -- upcoming, playing, finished, abandoned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Templates Table
CREATE TABLE IF NOT EXISTS tournament.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  advance_count INTEGER,
  league_match_count INTEGER,
  players_per_match INTEGER DEFAULT 2,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournament.tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament.participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON tournament.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_player1 ON tournament.matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2 ON tournament.matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_player3 ON tournament.matches(player3_id);
CREATE INDEX IF NOT EXISTS idx_matches_player4 ON tournament.matches(player4_id);

-- 7. Grants
GRANT ALL ON ALL TABLES IN SCHEMA tournament TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tournament TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA tournament GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tournament GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tournament GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
