-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_start_tournament(TEXT, TEXT);

-- Start Tournament RPC
CREATE OR REPLACE FUNCTION tournament.start_tournament(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_tournament tournament.tournaments;
    v_participant_count INTEGER;
    v_ppm INTEGER;
    v_rounds INTEGER;
    v_match_players UUID[];
BEGIN
    -- Auth check
    SELECT id INTO v_admin_id FROM public.users WHERE clerk_id = admin_clerk_id;
    SELECT * INTO v_tournament FROM tournament.tournaments WHERE slug = slug_param;

    IF v_tournament IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
    IF v_tournament.admin_user_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;

    -- Check participants
    SELECT COUNT(*) INTO v_participant_count FROM tournament.participants WHERE tournament_id = v_tournament.id;
    IF v_participant_count < 2 THEN RAISE EXCEPTION 'Not enough participants'; END IF;

    -- Update status
    UPDATE tournament.tournaments 
    SET status = 'active', start_at = NOW() 
    WHERE id = v_tournament.id;

    -- Create League Matches
    IF v_tournament.format = 'league_knockout' THEN
        v_ppm := v_tournament.players_per_match;
        IF v_ppm IS NULL THEN v_ppm := 2; END IF;
        v_rounds := v_tournament.league_match_count;
        IF v_rounds IS NULL THEN v_rounds := 3; END IF;

        FOR r IN 1..v_rounds LOOP
            -- Shuffle and create matches (simplified shuffle logic for SQL)
            INSERT INTO tournament.matches (tournament_id, phase, round, player1_id, player2_id, status)
            SELECT 
                v_tournament.id, 'league', r,
                p_list.p1, p_list.p2, 'upcoming'
            FROM (
                SELECT 
                    id_list[i] as p1,
                    id_list[i+1] as p2
                FROM (
                    SELECT array_agg(id ORDER BY random()) as id_list
                    FROM tournament.participants
                    WHERE tournament_id = v_tournament.id
                ) AS sub,
                generate_series(1, array_length(id_list, 1) - 1, 2) AS i
            ) AS p_list;
        END LOOP;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
