-- Migration: Add players_per_match to templates
ALTER TABLE tournament.templates ADD COLUMN IF NOT EXISTS players_per_match INTEGER DEFAULT 2;

-- Update get_templates function to include the new column
DROP FUNCTION IF EXISTS tournament.get_templates();

CREATE OR REPLACE FUNCTION tournament.get_templates()
RETURNS TABLE (
    id UUID,
    name TEXT,
    format TEXT,
    capacity INTEGER,
    advance_count INTEGER,
    league_match_count INTEGER,
    players_per_match INTEGER,
    config JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.name, t.format, t.capacity, 
        t.advance_count, t.league_match_count, t.players_per_match,
        t.config, t.created_at
    FROM tournament.templates t
    ORDER BY t.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set Catan template to 4 players
UPDATE tournament.templates SET players_per_match = 4 WHERE name = 'Catan Turnuvası';
