-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS tournament;

-- 2. Move Tournaments Table
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tournaments') THEN
        ALTER TABLE public.tournaments SET SCHEMA tournament;
    END IF;
END $$;

-- 3. Move Participants Table
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tournament_participants') THEN
        ALTER TABLE public.tournament_participants SET SCHEMA tournament;
        ALTER TABLE tournament.tournament_participants RENAME TO participants;
    END IF;
END $$;

-- 4. Move Matches Table
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tournament_matches') THEN
        ALTER TABLE public.tournament_matches SET SCHEMA tournament;
        ALTER TABLE tournament.tournament_matches RENAME TO matches;
    END IF;
END $$;

-- 5. Move Templates Table
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tournament_templates') THEN
        ALTER TABLE public.tournament_templates SET SCHEMA tournament;
        ALTER TABLE tournament.tournament_templates RENAME TO templates;
    END IF;
END $$;

-- 6. Ensure all tables exist (for fresh install)
CREATE TABLE IF NOT EXISTS tournament.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  admin_user_id UUID NOT NULL REFERENCES public.users(id),
  capacity INTEGER DEFAULT 16,
  advance_count INTEGER DEFAULT 4,
  current_league_round INTEGER DEFAULT 1,
  league_match_count INTEGER DEFAULT 3,
  format TEXT DEFAULT 'league_knockout',
  start_at TIMESTAMPTZ,
  winner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournament.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  username TEXT NOT NULL,
  avatar TEXT,
  points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  average INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_manual BOOLEAN DEFAULT FALSE,
  UNIQUE(tournament_id, user_id)
);

CREATE TABLE IF NOT EXISTS tournament.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournament.tournaments(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  round INTEGER NOT NULL DEFAULT 1,
  player1_id UUID REFERENCES public.users(id),
  player2_id UUID REFERENCES public.users(id),
  winner_id UUID REFERENCES public.users(id),
  score1 INTEGER DEFAULT 0,
  score2 INTEGER DEFAULT 0,
  score1_json JSONB DEFAULT '[]',
  score2_json JSONB DEFAULT '[]',
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  advance_count INTEGER,
  league_match_count INTEGER,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ensure Indices
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournament.tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament.participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON tournament.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_players ON tournament.matches(player1_id, player2_id);
