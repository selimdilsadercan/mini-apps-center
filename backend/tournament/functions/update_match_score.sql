-- Update Match Score RPC
CREATE OR REPLACE FUNCTION tournament.update_match_score(
    match_id UUID,
    scores_param JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_player1_id UUID;
    v_player2_id UUID;
    v_ppm INTEGER;
    v_s1 INTEGER;
    v_s2 INTEGER;
    v_winner_id UUID;
BEGIN
    -- Get match details
    SELECT m.player1_id, m.player2_id, t.players_per_match
    INTO v_player1_id, v_player2_id, v_ppm
    FROM tournament.matches m
    JOIN tournament.tournaments t ON m.tournament_id = t.id
    WHERE m.id = match_id;

    -- Determine winner for 2-player matches
    IF v_ppm = 2 THEN
        v_s1 := (scores_param->>(v_player1_id::TEXT))::INTEGER;
        v_s2 := (scores_param->>(v_player2_id::TEXT))::INTEGER;
        
        IF v_s1 > v_s2 THEN v_winner_id := v_player1_id;
        ELSIF v_s2 > v_s1 THEN v_winner_id := v_player2_id;
        END IF;
    END IF;

    UPDATE tournament.matches
    SET scores = scores_param,
        winner_id = v_winner_id,
        status = 'finished',
        updated_at = NOW()
    WHERE id = match_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
