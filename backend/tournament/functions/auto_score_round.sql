-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_auto_score_round(TEXT, TEXT);
DROP FUNCTION IF EXISTS tournament.auto_score_round(TEXT, TEXT);

-- Auto Score Round RPC
CREATE OR REPLACE FUNCTION tournament.auto_score_round(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tournament_id UUID;
    v_admin_id UUID;
    v_current_round INTEGER;
    v_phase TEXT;
    v_match_record RECORD;
    v_scores JSONB;
BEGIN
    -- Get tournament info
    SELECT id, admin_user_id, current_league_round 
    INTO v_tournament_id, v_admin_id, v_current_round
    FROM tournament.tournaments 
    WHERE slug = slug_param;

    -- Verify admin
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_admin_id AND clerk_id = admin_clerk_id) THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    -- Determine current phase and round
    IF v_current_round > 0 THEN
        v_phase := 'league';
    ELSE
        SELECT COALESCE(MAX(round), 0) INTO v_current_round 
        FROM tournament.matches 
        WHERE tournament_id = v_tournament_id AND phase = 'bracket';
        v_phase := 'bracket';
    END IF;

    -- Update all matches in current round that are not finished
    FOR v_match_record IN 
        SELECT id, player1_id, player2_id, player3_id, player4_id 
        FROM tournament.matches 
        WHERE tournament_id = v_tournament_id 
          AND phase = v_phase 
          AND round = v_current_round 
          AND status != 'finished'
    LOOP
        -- Generate random scores
        v_scores := jsonb_build_object(
            v_match_record.player1_id::TEXT, floor(random() * 11),
            v_match_record.player2_id::TEXT, floor(random() * 11)
        );
        
        IF v_match_record.player3_id IS NOT NULL THEN
            v_scores := v_scores || jsonb_build_object(v_match_record.player3_id::TEXT, floor(random() * 11));
        END IF;
        
        IF v_match_record.player4_id IS NOT NULL THEN
            v_scores := v_scores || jsonb_build_object(v_match_record.player4_id::TEXT, floor(random() * 11));
        END IF;

        -- Update the match
        PERFORM tournament.update_match_score(v_match_record.id, v_scores);
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
