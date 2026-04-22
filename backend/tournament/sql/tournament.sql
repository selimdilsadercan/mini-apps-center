-- Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, active, completed
  admin_user_id UUID NOT NULL REFERENCES users(id),
  capacity INTEGER DEFAULT 16,
  advance_count INTEGER DEFAULT 4, -- How many people move to bracket
  current_league_round INTEGER DEFAULT 1,
  league_match_count INTEGER DEFAULT 3,
  format TEXT DEFAULT 'league_knockout', -- league_knockout, knockout
  start_at TIMESTAMPTZ,
  winner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants Table
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  username TEXT NOT NULL,
  avatar TEXT,
  points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  average INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Matches Table
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  phase TEXT NOT NULL, -- 'league' or 'bracket'
  round INTEGER NOT NULL DEFAULT 1,
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  winner_id UUID REFERENCES users(id),
  score1 INTEGER DEFAULT 0,
  score2 INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming', -- upcoming, playing, finished, abandoned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_players ON tournament_matches(player1_id, player2_id);
