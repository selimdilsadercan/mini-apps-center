-- Start Tournament RPC
CREATE OR REPLACE FUNCTION tournament.start_tournament(slug_param TEXT, admin_clerk_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_tournament_id UUID;
    v_admin_id UUID;
    v_format TEXT;
    v_ppm INTEGER;
    v_participant_count INTEGER;
    v_player_idx INTEGER;
    v_shuffled_ids UUID[];
    v_p1 UUID; v_p2 UUID; v_p3 UUID; v_p4 UUID;
BEGIN
    SELECT t.id, t.admin_user_id, t.format, t.players_per_match
    INTO v_tournament_id, v_admin_id, v_format, v_ppm
    FROM tournament.tournaments t WHERE t.slug = slug_param;

    IF v_tournament_id IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
    v_ppm := COALESCE(v_ppm, 2);

    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_admin_id AND clerk_id = admin_clerk_id) THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    SELECT COUNT(*) INTO v_participant_count FROM tournament.participants WHERE tournament_id = v_tournament_id;
    IF v_participant_count < 2 THEN RAISE EXCEPTION 'Not enough participants'; END IF;

    UPDATE tournament.tournaments SET status = 'active', start_at = NOW(), current_league_round = 1 WHERE id = v_tournament_id;

    SELECT array_agg(p.id ORDER BY random()) INTO v_shuffled_ids
    FROM tournament.participants p WHERE p.tournament_id = v_tournament_id;

    v_player_idx := 1;
    WHILE v_player_idx + 1 <= v_participant_count LOOP
        v_p1 := v_shuffled_ids[v_player_idx];
        v_p2 := v_shuffled_ids[v_player_idx + 1];
        v_p3 := NULL; v_p4 := NULL;

        IF v_ppm >= 3 AND v_player_idx + 2 <= v_participant_count THEN v_p3 := v_shuffled_ids[v_player_idx + 2]; END IF;
        IF v_ppm >= 4 AND v_player_idx + 3 <= v_participant_count THEN v_p4 := v_shuffled_ids[v_player_idx + 3]; END IF;

        INSERT INTO tournament.matches (tournament_id, phase, round, status, player1_id, player2_id, player3_id, player4_id)
        VALUES (v_tournament_id, CASE WHEN v_format = 'knockout' THEN 'bracket' ELSE 'league' END, 1, 'playing', v_p1, v_p2, v_p3, v_p4);

        v_player_idx := v_player_idx + v_ppm;
    END LOOP;

    IF v_format = 'knockout' THEN UPDATE tournament.tournaments SET current_league_round = 0 WHERE id = v_tournament_id; END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
