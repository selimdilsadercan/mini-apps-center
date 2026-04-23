-- Drop old versions
DROP FUNCTION IF EXISTS public.tournament_get_standings(TEXT);
DROP FUNCTION IF EXISTS tournament.get_standings(TEXT);

-- Get Standings RPC (Live Calculation from Matches)
CREATE OR REPLACE FUNCTION tournament.get_standings(slug_param TEXT)
RETURNS TABLE (
    id UUID,
    tournament_id UUID,
    user_id UUID,
    username TEXT,
    avatar TEXT,
    points BIGINT,
    wins BIGINT,
    losses BIGINT,
    average NUMERIC,
    joined_at TIMESTAMPTZ
) AS $$
DECLARE
    v_tournament_id UUID;
BEGIN
    -- Get tournament ID
    SELECT t.id INTO v_tournament_id FROM tournament.tournaments t WHERE t.slug = slug_param;
    
    RETURN QUERY
    SELECT 
        p.id, 
        p.tournament_id, 
        p.user_id, 
        p.username, 
        p.avatar,
        -- Point Calculation
        COALESCE((
            SELECT SUM((m.scores->>p.id::text)::integer)
            FROM tournament.matches m
            WHERE m.tournament_id = v_tournament_id 
              AND (m.player1_id = p.id OR m.player2_id = p.id OR m.player3_id = p.id OR m.player4_id = p.id)
              AND m.status = 'finished'
        ), 0)::BIGINT as points,
        -- Win Calculation
        COALESCE((
            SELECT COUNT(*)
            FROM tournament.matches m
            WHERE m.tournament_id = v_tournament_id 
              AND (SELECT key::uuid FROM jsonb_each_text(m.scores) ORDER BY value::integer DESC LIMIT 1) = p.id
              AND m.status = 'finished'
        ), 0)::BIGINT as wins,
        -- Loss Calculation
        COALESCE((
            SELECT COUNT(*)
            FROM tournament.matches m
            WHERE m.tournament_id = v_tournament_id 
              AND (m.player1_id = p.id OR m.player2_id = p.id OR m.player3_id = p.id OR m.player4_id = p.id)
              AND EXISTS (SELECT 1 FROM jsonb_each_text(m.scores))
              AND (SELECT key::uuid FROM jsonb_each_text(m.scores) ORDER BY value::integer DESC LIMIT 1) != p.id
              AND m.status = 'finished'
        ), 0)::BIGINT as losses,
        -- Average Calculation
        COALESCE((
            SELECT ROUND(AVG((m.scores->>p.id::text)::integer), 2)
            FROM tournament.matches m
            WHERE m.tournament_id = v_tournament_id 
              AND (m.player1_id = p.id OR m.player2_id = p.id OR m.player3_id = p.id OR m.player4_id = p.id)
              AND m.status = 'finished'
        ), 0)::NUMERIC as average,
        p.joined_at
    FROM tournament.participants p
    WHERE p.tournament_id = v_tournament_id
    ORDER BY points DESC, average DESC, p.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
