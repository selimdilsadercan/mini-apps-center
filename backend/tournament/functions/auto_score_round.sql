-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_auto_score_round(TEXT, TEXT);

-- Auto Score Current Round RPC
CREATE OR REPLACE FUNCTION tournament.auto_score_round(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_tournament tournament.tournaments;
    v_round INTEGER;
    v_phase TEXT;
    v_match_id UUID;
    v_p1 UUID;
    v_p2 UUID;
    v_s1 INTEGER;
    v_s2 INTEGER;
    v_scores JSONB;
BEGIN
    SELECT id INTO v_admin_id FROM public.users WHERE clerk_id = admin_clerk_id;
    SELECT * INTO v_tournament FROM tournament.tournaments WHERE slug = slug_param;

    IF v_tournament IS NULL THEN RETURN FALSE; END IF;
    IF v_tournament.admin_user_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;

    v_round := v_tournament.current_league_round;
    v_phase := 'league';

    IF v_round = 0 THEN
        SELECT round INTO v_round 
        FROM tournament.matches 
        WHERE tournament_id = v_tournament.id AND phase = 'bracket' 
        ORDER BY round DESC LIMIT 1;
        v_phase := 'bracket';
    END IF;

    FOR v_match_id, v_p1, v_p2 IN 
        SELECT id, player1_id, player2_id 
        FROM tournament.matches 
        WHERE tournament_id = v_tournament.id AND phase = v_phase AND round = v_round AND status != 'finished'
    LOOP
        v_s1 := floor(random() * 11);
        v_s2 := floor(random() * 11);
        v_scores := jsonb_build_object(v_p1::TEXT, v_s1, v_p2::TEXT, v_s2);

        PERFORM tournament.update_match_score(v_match_id, v_scores);
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
