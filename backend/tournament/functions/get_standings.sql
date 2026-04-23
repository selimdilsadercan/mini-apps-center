-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_get_standings(TEXT);

-- Get Standings RPC
CREATE OR REPLACE FUNCTION tournament.get_standings(slug_param TEXT)
RETURNS SETOF tournament.participants AS $$
DECLARE
    v_tournament_id UUID;
BEGIN
    SELECT id INTO v_tournament_id FROM tournament.tournaments WHERE slug = slug_param;
    
    RETURN QUERY
    SELECT * FROM tournament.participants
    WHERE tournament_id = v_tournament_id
    ORDER BY points DESC, average DESC, joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
