-- Tournament Schema
CREATE SCHEMA IF NOT EXISTS tournament;

-- Tournaments Table
CREATE TABLE IF NOT EXISTS tournament.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, active, completed
  admin_user_id UUID NOT NULL REFERENCES public.users(id),
  capacity INTEGER DEFAULT 16,
  advance_count INTEGER DEFAULT 4, -- How many people move to bracket
  current_league_round INTEGER DEFAULT 1,
  league_match_count INTEGER DEFAULT 3,
  format TEXT DEFAULT 'league_knockout', -- league_knockout, knockout
  players_per_match INTEGER DEFAULT 2,
  start_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants Table
CREATE TABLE IF NOT EXISTS tournament.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournament.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id), -- Nullable for mock players
  username TEXT NOT NULL,
  avatar TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_manual BOOLEAN DEFAULT FALSE,
  avoid_list TEXT[] DEFAULT '{}',
  UNIQUE(tournament_id, user_id)
);

-- Matches Table
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

-- Tournament Templates
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournament.tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament.participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON tournament.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_players ON tournament.matches(player1_id, player2_id);
