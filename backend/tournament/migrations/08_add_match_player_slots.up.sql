-- Migration: Add player3 and player4 to matches table
ALTER TABLE tournament.matches 
ADD COLUMN IF NOT EXISTS player3_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS player4_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_matches_player3 ON tournament.matches(player3_id);
CREATE INDEX IF NOT EXISTS idx_matches_player4 ON tournament.matches(player4_id);

-- Re-grant permissions
GRANT ALL ON TABLE tournament.matches TO anon, authenticated;
