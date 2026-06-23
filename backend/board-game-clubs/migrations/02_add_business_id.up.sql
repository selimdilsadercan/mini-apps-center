-- Add business_id to board_game_clubs.clubs
ALTER TABLE board_game_clubs.clubs ADD COLUMN IF NOT EXISTS business_id TEXT REFERENCES business.businesses(id) ON DELETE CASCADE;

-- Index for business_id
CREATE INDEX IF NOT EXISTS idx_bgc_clubs_business ON board_game_clubs.clubs(business_id);
