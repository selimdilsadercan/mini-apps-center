-- Get Tournament Matches RPC
CREATE OR REPLACE FUNCTION tournament.get_matches(slug_param TEXT)
RETURNS TABLE (
    id UUID,
    tournament_id UUID,
    phase TEXT,
    round INTEGER,
    player1_id UUID,
    player2_id UUID,
    winner_id UUID,
    score1 INTEGER,
    score2 INTEGER,
    scores JSONB,
    status TEXT,
    created_at TIMESTAMPTZ,
    username1 TEXT,
    username2 TEXT,
    avatar1 TEXT,
    avatar2 TEXT
) AS $$
DECLARE
    v_tournament_id UUID;
BEGIN
    SELECT t.id INTO v_tournament_id FROM tournament.tournaments t WHERE t.slug = slug_param;

    RETURN QUERY
    SELECT 
        m.id, m.tournament_id, m.phase, m.round, m.player1_id, m.player2_id, 
        m.winner_id, m.score1, m.score2, m.scores, m.status, m.created_at,
        p1.username as username1, p2.username as username2,
        p1.avatar as avatar1, p2.avatar as avatar2
    FROM tournament.matches m
    LEFT JOIN tournament.participants p1 ON m.player1_id = p1.id
    LEFT JOIN tournament.participants p2 ON m.player2_id = p2.id
    WHERE m.tournament_id = v_tournament_id
    ORDER BY m.round ASC, m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
