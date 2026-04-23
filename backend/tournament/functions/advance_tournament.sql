-- Advance Tournament RPC
CREATE OR REPLACE FUNCTION tournament.advance_tournament(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_tournament_id UUID;
    v_admin_user_id UUID;
    v_format TEXT;
    v_ppm INTEGER;
    v_league_rounds INTEGER;
    v_advance_count INTEGER;
    v_current_league_round INTEGER;
    v_current_status TEXT;
    
    v_winners UUID[];
    v_bracket_round INTEGER;
    v_player_idx INTEGER;
    v_unfinished_count INTEGER;
    v_winner_count INTEGER;
    v_participant_count INTEGER;
    v_shuffled_ids UUID[];
BEGIN
    SELECT id INTO v_admin_id FROM public.users WHERE clerk_id = admin_clerk_id;
    
    SELECT 
        t.id, t.admin_user_id, t.format, t.players_per_match, 
        t.league_match_count, t.advance_count, t.current_league_round, t.status
    INTO 
        v_tournament_id, v_admin_user_id, v_format, v_ppm, 
        v_league_rounds, v_advance_count, v_current_league_round, v_current_status
    FROM tournament.tournaments t
    WHERE t.slug = slug_param;

    IF v_tournament_id IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
    IF v_admin_user_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;
    
    v_ppm := COALESCE(v_ppm, 2);

    -- 2. League Phase
    IF v_current_league_round > 0 THEN
        SELECT COUNT(*) INTO v_unfinished_count 
        FROM tournament.matches 
        WHERE tournament_id = v_tournament_id AND phase = 'league' AND round = v_current_league_round AND status != 'finished';

        IF v_unfinished_count > 0 THEN RAISE EXCEPTION 'Current round has unfinished matches'; END IF;

        IF v_current_league_round < v_league_rounds THEN
            SELECT COUNT(*) INTO v_participant_count FROM tournament.participants WHERE tournament_id = v_tournament_id;
            SELECT array_agg(id ORDER BY random()) INTO v_shuffled_ids FROM tournament.participants WHERE tournament_id = v_tournament_id;

            FOR v_player_idx IN 1..v_participant_count BY v_ppm LOOP
                IF v_player_idx + 1 <= v_participant_count THEN
                    INSERT INTO tournament.matches (
                        tournament_id, phase, round, status,
                        player1_id, player2_id, player3_id, player4_id
                    ) VALUES (
                        v_tournament_id, 'league', v_current_league_round + 1, 'playing',
                        v_shuffled_ids[v_player_idx],
                        v_shuffled_ids[v_player_idx + 1],
                        CASE WHEN v_ppm >= 3 AND v_player_idx + 2 <= v_participant_count THEN v_shuffled_ids[v_player_idx + 2] ELSE NULL END,
                        CASE WHEN v_ppm >= 4 AND v_player_idx + 3 <= v_participant_count THEN v_shuffled_ids[v_player_idx + 3] ELSE NULL END
                    );
                END IF;
            END LOOP;

            UPDATE tournament.tournaments SET current_league_round = v_current_league_round + 1 WHERE id = v_tournament_id;
            RETURN TRUE;
        ELSE
            -- Move to Bracket
            SELECT array_agg(sub.id) INTO v_winners FROM (SELECT p.id FROM tournament.get_standings(slug_param) p LIMIT v_advance_count) sub;
            v_winner_count := COALESCE(array_length(v_winners, 1), 0);

            FOR v_player_idx IN 1..v_winner_count BY v_ppm LOOP
                IF v_player_idx + 1 <= v_winner_count THEN
                    INSERT INTO tournament.matches (
                        tournament_id, phase, round, status,
                        player1_id, player2_id, player3_id, player4_id
                    ) VALUES (
                        v_tournament_id, 'bracket', 1, 'playing',
                        v_winners[v_player_idx],
                        v_winners[v_player_idx + 1],
                        CASE WHEN v_ppm >= 3 AND v_player_idx + 2 <= v_winner_count THEN v_winners[v_player_idx + 2] ELSE NULL END,
                        CASE WHEN v_ppm >= 4 AND v_player_idx + 3 <= v_winner_count THEN v_winners[v_player_idx + 3] ELSE NULL END
                    );
                END IF;
            END LOOP;

            UPDATE tournament.tournaments SET current_league_round = 0 WHERE id = v_tournament_id;
            RETURN TRUE;
        END IF;
    END IF;

    -- 3. Bracket Phase
    SELECT COALESCE(MAX(round), 0) INTO v_bracket_round FROM tournament.matches WHERE tournament_id = v_tournament_id AND phase = 'bracket';
    SELECT COUNT(*) INTO v_unfinished_count FROM tournament.matches WHERE tournament_id = v_tournament_id AND phase = 'bracket' AND round = v_bracket_round AND status != 'finished';
    IF v_unfinished_count > 0 THEN RAISE EXCEPTION 'Current bracket round has unfinished matches'; END IF;

    -- Collect winners of current bracket round (Top 1 from each match, calculated from scores)
    SELECT array_agg(sub.winner_id ORDER BY sub.created_at ASC) INTO v_winners
    FROM (
        SELECT (
            SELECT key::uuid
            FROM jsonb_each_text(m.scores)
            ORDER BY value::integer DESC
            LIMIT 1
        ) as winner_id,
        m.created_at
        FROM tournament.matches m
        WHERE m.tournament_id = v_tournament_id AND m.phase = 'bracket' AND m.round = v_bracket_round
    ) sub;

    v_winner_count := COALESCE(array_length(v_winners, 1), 0);
    IF v_winner_count = 0 THEN RAISE EXCEPTION 'No winners found to advance'; END IF;

    IF v_winner_count = 1 THEN
        UPDATE tournament.tournaments SET status = 'completed' WHERE id = v_tournament_id;
        RETURN TRUE;
    END IF;

    -- Create next bracket round
    FOR v_player_idx IN 1..v_winner_count BY v_ppm LOOP
        IF v_player_idx + 1 <= v_winner_count THEN
            INSERT INTO tournament.matches (
                tournament_id, phase, round, status,
                player1_id, player2_id, player3_id, player4_id
            ) VALUES (
                v_tournament_id, 'bracket', v_bracket_round + 1, 'playing',
                v_winners[v_player_idx],
                v_winners[v_player_idx + 1],
                CASE WHEN v_ppm >= 3 AND v_player_idx + 2 <= v_winner_count THEN v_winners[v_player_idx + 2] ELSE NULL END,
                CASE WHEN v_ppm >= 4 AND v_player_idx + 3 <= v_winner_count THEN v_winners[v_player_idx + 3] ELSE NULL END
            );
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
