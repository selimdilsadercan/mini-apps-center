-- 1. Fix Participants Schema (Make user_id nullable for mock players)
ALTER TABLE tournament.participants ALTER COLUMN user_id DROP NOT NULL;

-- 2. Update Matches Schema to use Participants instead of Users
-- Drop and recreate matches table to fix references
DROP TABLE IF EXISTS tournament.matches CASCADE;

CREATE TABLE tournament.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournament.tournaments(id) ON DELETE CASCADE,
  phase TEXT NOT NULL, -- 'league' or 'bracket'
  round INTEGER NOT NULL DEFAULT 1,
  player1_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL,
  scores JSONB DEFAULT '{}',
  status TEXT DEFAULT 'upcoming', -- upcoming, playing, finished, abandoned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Re-apply all functions to ensure they use the new schema
-- (Run the SQL files in backend/tournament/functions/ if you can, 
-- or use the ones I provided earlier)

-- 4. Re-grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA tournament TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tournament TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tournament TO anon, authenticated;
