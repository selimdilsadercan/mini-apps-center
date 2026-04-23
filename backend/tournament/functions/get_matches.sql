-- 1. get_matches: player3/player4 dahil döndür
DROP FUNCTION IF EXISTS tournament.get_matches(TEXT);

CREATE OR REPLACE FUNCTION tournament.get_matches(slug_param TEXT)
RETURNS TABLE (
    id UUID,
    tournament_id UUID,
    phase TEXT,
    round INTEGER,
    status TEXT,
    player1_id UUID,
    player2_id UUID,
    player3_id UUID,
    player4_id UUID,
    winner_id UUID,
    scores JSONB,
    created_at TIMESTAMPTZ,
    username1 TEXT,
    avatar1 TEXT,
    username2 TEXT,
    avatar2 TEXT,
    username3 TEXT,
    avatar3 TEXT,
    username4 TEXT,
    avatar4 TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id, m.tournament_id, m.phase, m.round, m.status,
        m.player1_id, m.player2_id, m.player3_id, m.player4_id,
        (SELECT key::uuid FROM jsonb_each_text(m.scores) ORDER BY value::integer DESC LIMIT 1) as winner_id, 
        m.scores, m.created_at,
        p1.username, p1.avatar,
        p2.username, p2.avatar,
        p3.username, p3.avatar,
        p4.username, p4.avatar
    FROM tournament.matches m
    JOIN tournament.tournaments t ON m.tournament_id = t.id
    LEFT JOIN tournament.participants p1 ON m.player1_id = p1.id
    LEFT JOIN tournament.participants p2 ON m.player2_id = p2.id
    LEFT JOIN tournament.participants p3 ON m.player3_id = p3.id
    LEFT JOIN tournament.participants p4 ON m.player4_id = p4.id
    WHERE t.slug = slug_param
    ORDER BY m.phase DESC, m.round ASC, m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;