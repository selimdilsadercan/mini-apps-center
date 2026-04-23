-- Reset Current Round RPC
CREATE OR REPLACE FUNCTION tournament.reset_round(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_tournament tournament.tournaments;
    v_round INTEGER;
    v_phase TEXT;
BEGIN
    SELECT id INTO v_admin_id FROM public.users WHERE clerk_id = admin_clerk_id;
    SELECT * INTO v_tournament FROM tournament.tournaments WHERE slug = slug_param;

    IF v_tournament IS NULL THEN RETURN FALSE; END IF;
    IF v_tournament.admin_user_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;

    v_round := v_tournament.current_league_round;
    v_phase := 'league';

    IF v_round = 0 THEN
        -- Bracket phase, find latest round
        SELECT round INTO v_round 
        FROM tournament.matches 
        WHERE tournament_id = v_tournament.id AND phase = 'bracket' 
        ORDER BY round DESC LIMIT 1;
        v_phase := 'bracket';
    END IF;

    IF v_round IS NULL OR v_round = 0 THEN RETURN FALSE; END IF;

    UPDATE tournament.matches
    SET scores = '[]', status = 'upcoming', winner_id = NULL, score1 = 0, score2 = 0
    WHERE tournament_id = v_tournament.id AND phase = v_phase AND round = v_round;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
