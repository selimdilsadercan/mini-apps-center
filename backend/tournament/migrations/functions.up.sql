-- FUNCTIONS
-- 1. tournament.get_tournaments
-- 2. tournament.get_tournament_details
-- 3. tournament.create_tournament
-- 4. tournament.join_tournament
-- 5. tournament.update_participant
-- 6. tournament.delete_participant
-- 7. tournament.update_match_score
-- 8. tournament.fill_mock_players
-- 9. tournament.delete_tournament
-- 10. tournament.get_templates
-- 11. tournament.start_tournament
-- 12. tournament.get_matches
-- 13. tournament.get_standings
-- 14. tournament.advance_tournament
-- 15. tournament.auto_score_round
-- 16. tournament.reset_tournament
-- 17. tournament.reset_round
-- 18. tournament.clear_participants
-- 19. tournament.tournament_save_manual_matches

-- 1. Get All Tournaments
DROP FUNCTION IF EXISTS tournament.get_tournaments();
CREATE OR REPLACE FUNCTION tournament.get_tournaments()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    icon TEXT,
    status TEXT,
    admin_user_id UUID,
    capacity INTEGER,
    format TEXT,
    players_per_match INTEGER,
    created_at TIMESTAMPTZ,
    participants_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.name, t.slug, t.icon, t.status, 
        t.admin_user_id, 
        t.capacity, t.format, t.players_per_match, t.created_at,
        (SELECT COUNT(*) FROM tournament.participants WHERE tournament_id = t.id) as participants_count
    FROM tournament.tournaments t
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Get Tournament Details
DROP FUNCTION IF EXISTS tournament.get_tournament_details(TEXT, TEXT);
CREATE OR REPLACE FUNCTION tournament.get_tournament_details(
    slug_param TEXT,
    viewer_clerk_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    icon TEXT,
    status TEXT,
    admin_user_id UUID,
    capacity INTEGER,
    advance_count INTEGER,
    current_league_round INTEGER,
    league_match_count INTEGER,
    format TEXT,
    players_per_match INTEGER,
    start_at TIMESTAMPTZ,
    winner_id UUID,
    participants_count BIGINT,
    is_joined BOOLEAN
) AS $$
DECLARE
    v_viewer_id UUID := public.get_internal_user_id(viewer_clerk_id);
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.name, t.slug, t.icon, t.status, 
        t.admin_user_id, 
        t.capacity, t.advance_count, t.current_league_round, t.league_match_count,
        t.format, t.players_per_match, t.start_at, 
        (
            SELECT (SELECT key::uuid FROM jsonb_each_text(m.scores) ORDER BY value::integer DESC LIMIT 1)
            FROM tournament.matches m
            WHERE m.tournament_id = t.id AND m.phase = 'bracket' AND m.status = 'finished'
            ORDER BY m.round DESC, m.created_at DESC
            LIMIT 1
        ) as winner_id,
        (SELECT COUNT(*) FROM tournament.participants WHERE tournament_id = t.id),
        EXISTS(SELECT 1 FROM tournament.participants WHERE tournament_id = t.id AND user_id = v_viewer_id)
    FROM tournament.tournaments t
    WHERE t.slug = slug_param;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Create Tournament
DROP FUNCTION IF EXISTS tournament.create_tournament(TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, INTEGER, INTEGER, TEXT);
CREATE OR REPLACE FUNCTION tournament.create_tournament(
    name_param TEXT,
    slug_param TEXT,
    icon_param TEXT,
    capacity_param INTEGER,
    format_param TEXT,
    league_match_count_param INTEGER,
    advance_count_param INTEGER,
    players_per_match_param INTEGER,
    admin_clerk_id TEXT
)
RETURNS SETOF tournament.tournaments AS $$
DECLARE
    v_admin_id UUID := public.get_internal_user_id(admin_clerk_id);
    v_new_tournament tournament.tournaments;
BEGIN
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found';
    END IF;

    INSERT INTO tournament.tournaments (
        name, slug, icon, capacity, format, 
        league_match_count, advance_count, players_per_match, admin_user_id
    ) VALUES (
        name_param, slug_param, icon_param, capacity_param, format_param,
        league_match_count_param, advance_count_param, players_per_match_param, v_admin_id
    ) RETURNING * INTO v_new_tournament;

    RETURN NEXT v_new_tournament;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Join Tournament
DROP FUNCTION IF EXISTS tournament.join_tournament(TEXT, TEXT, TEXT, TEXT, TEXT[]);
CREATE OR REPLACE FUNCTION tournament.join_tournament(
    slug_param TEXT,
    clerk_id_param TEXT,
    username_param TEXT,
    avatar_param TEXT,
    avoid_list_param TEXT[] DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tournament_id UUID;
    v_user_id UUID;
BEGIN
    SELECT id INTO v_tournament_id FROM tournament.tournaments WHERE slug = slug_param;
    IF v_tournament_id IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;

    IF clerk_id_param NOT LIKE 'manual_%' AND clerk_id_param NOT LIKE 'mock_%' THEN
        v_user_id := public.get_internal_user_id(clerk_id_param);
    END IF;

    INSERT INTO tournament.participants (
        tournament_id, user_id, username, avatar, avoid_list
    ) VALUES (
        v_tournament_id, v_user_id, username_param, avatar_param, avoid_list_param
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update Participant
DROP FUNCTION IF EXISTS tournament.update_participant(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION tournament.update_participant(
    participant_id UUID,
    username_param TEXT,
    avatar_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tournament.participants
    SET username = username_param,
        avatar = avatar_param
    WHERE id = participant_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Delete Participant
DROP FUNCTION IF EXISTS tournament.delete_participant(UUID);
CREATE OR REPLACE FUNCTION tournament.delete_participant(participant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM tournament.participants WHERE id = participant_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update Match Score
DROP FUNCTION IF EXISTS tournament.update_match_score(UUID, JSONB);
CREATE OR REPLACE FUNCTION tournament.update_match_score(
    match_id UUID,
    scores_param JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tournament.matches
    SET scores = scores_param,
        status = 'finished',
        updated_at = NOW()
    WHERE id = match_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fill Mock Players
DROP FUNCTION IF EXISTS tournament.fill_mock_players(TEXT);
CREATE OR REPLACE FUNCTION tournament.fill_mock_players(slug_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_tournament_id UUID;
    v_capacity INTEGER;
    v_current_count INTEGER;
    v_remaining INTEGER;
    v_mock_names TEXT[] := ARRAY['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu', 'Maverick', 'Goose', 'Iceman', 'Viper', 'Phoenix', 'Rooster', 'Bob', 'Hangman', 'Coyote', 'Payback', 'Fanboy'];
    v_skins TEXT[] := ARRAY['f8d25c', 'ffdbb4', 'edb98a', 'd08b5b', 'ae5d29', '614335'];
    v_tops TEXT[] := ARRAY['bigHair', 'bob', 'bun', 'curly', 'curvy', 'dreads', 'frida', 'fro', 'shaggy', 'shortFlat', 'shortRound', 'sides'];
    v_mouths TEXT[] := ARRAY['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'serious', 'smile', 'tongue'];
    v_eyes TEXT[] := ARRAY['closed', 'cry', 'default', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink'];
    v_clothing TEXT[] := ARRAY['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck'];
    v_skin TEXT; v_top TEXT; v_mouth TEXT; v_eye TEXT; v_cloth TEXT; v_avatar_url TEXT;
BEGIN
    SELECT id, capacity INTO v_tournament_id, v_capacity FROM tournament.tournaments WHERE slug = slug_param;
    IF v_tournament_id IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;

    SELECT COUNT(*) INTO v_current_count FROM tournament.participants WHERE tournament_id = v_tournament_id;
    v_remaining := v_capacity - v_current_count;

    IF v_remaining <= 0 THEN RETURN TRUE; END IF;

    FOR i IN 1..v_remaining LOOP
        v_skin := v_skins[floor(random() * array_length(v_skins, 1)) + 1];
        v_top := v_tops[floor(random() * array_length(v_tops, 1)) + 1];
        v_mouth := v_mouths[floor(random() * array_length(v_mouths, 1)) + 1];
        v_eye := v_eyes[floor(random() * array_length(v_eyes, 1)) + 1];
        v_cloth := v_clothing[floor(random() * array_length(v_clothing, 1)) + 1];
        
        v_avatar_url := 'https://api.dicebear.com/9.x/avataaars/svg?' || 'skinColor=' || v_skin || '&top=' || v_top || '&mouth=' || v_mouth || '&eyes=' || v_eye || '&clothing=' || v_cloth || '&clothesColor=65c9ff' || '&accessoriesProbability=0';

        INSERT INTO tournament.participants (tournament_id, username, avatar)
        VALUES (v_tournament_id, v_mock_names[floor(random() * array_length(v_mock_names, 1)) + 1] || '_' || floor(random() * 999)::TEXT, v_avatar_url);
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Delete Tournament
DROP FUNCTION IF EXISTS tournament.delete_tournament(TEXT, TEXT);
CREATE OR REPLACE FUNCTION tournament.delete_tournament(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := public.get_internal_user_id(admin_clerk_id);
    v_tournament_id UUID;
    v_actual_admin_id UUID;
BEGIN
    SELECT id, admin_user_id INTO v_tournament_id, v_actual_admin_id FROM tournament.tournaments WHERE slug = slug_param;
    IF v_tournament_id IS NULL THEN RETURN FALSE; END IF;
    IF v_actual_admin_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;

    DELETE FROM tournament.tournaments WHERE id = v_tournament_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Get Templates
DROP FUNCTION IF EXISTS tournament.get_templates();
CREATE OR REPLACE FUNCTION tournament.get_templates()
RETURNS TABLE (
    id UUID,
    name TEXT,
    format TEXT,
    capacity INTEGER,
    advance_count INTEGER,
    league_match_count INTEGER,
    players_per_match INTEGER,
    config JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.format, t.capacity, t.advance_count, t.league_match_count, t.players_per_match, t.config, t.created_at
    FROM tournament.templates t
    ORDER BY t.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 11. Start Tournament
DROP FUNCTION IF EXISTS tournament.start_tournament(TEXT, TEXT);
CREATE OR REPLACE FUNCTION tournament.start_tournament(slug_param TEXT, admin_clerk_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_tournament_id UUID;
    v_admin_id UUID := public.get_internal_user_id(admin_clerk_id);
    v_actual_admin_id UUID;
    v_format TEXT;
    v_ppm INTEGER;
    v_participant_count INTEGER;
    v_player_idx INTEGER;
    v_shuffled_ids UUID[];
    v_p1 UUID; v_p2 UUID; v_p3 UUID; v_p4 UUID;
    v_swap_idx INTEGER;
    v_attempts INTEGER := 0;
    v_has_conflict BOOLEAN;
    v_p1_avoid TEXT[]; v_p2_avoid TEXT[]; v_p3_avoid TEXT[]; v_p4_avoid TEXT[];
    v_p1_name TEXT; v_p2_name TEXT; v_p3_name TEXT; v_p4_name TEXT;
    v_temp_id UUID;
BEGIN
    SELECT t.id, t.admin_user_id, t.format, t.players_per_match
    INTO v_tournament_id, v_actual_admin_id, v_format, v_ppm
    FROM tournament.tournaments t WHERE t.slug = slug_param;

    IF v_tournament_id IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
    IF v_actual_admin_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;

    v_ppm := COALESCE(v_ppm, 2);
    SELECT COUNT(*) INTO v_participant_count FROM tournament.participants WHERE tournament_id = v_tournament_id;
    IF v_participant_count < 2 THEN RAISE EXCEPTION 'Not enough participants'; END IF;

    UPDATE tournament.tournaments SET status = 'active', start_at = NOW(), current_league_round = 1 WHERE id = v_tournament_id;

    SELECT array_agg(p.id ORDER BY random()) INTO v_shuffled_ids FROM tournament.participants p WHERE p.tournament_id = v_tournament_id;

    WHILE v_attempts < 50 LOOP
        v_has_conflict := FALSE;
        v_player_idx := 1;
        WHILE v_player_idx + 1 <= v_participant_count LOOP
            v_p1 := v_shuffled_ids[v_player_idx];
            v_p2 := v_shuffled_ids[v_player_idx + 1];
            SELECT username, avoid_list INTO v_p1_name, v_p1_avoid FROM tournament.participants WHERE id = v_p1;
            SELECT username, avoid_list INTO v_p2_name, v_p2_avoid FROM tournament.participants WHERE id = v_p2;
            IF (v_p1_name = ANY(v_p2_avoid)) OR (v_p2_name = ANY(v_p1_avoid)) THEN
                v_has_conflict := TRUE;
                v_swap_idx := floor(random() * (v_participant_count - (v_player_idx + 1) + 1)) + (v_player_idx + 1);
                IF v_swap_idx > v_participant_count THEN v_swap_idx := v_participant_count; END IF;
                v_temp_id := v_shuffled_ids[v_player_idx + 1];
                v_shuffled_ids[v_player_idx + 1] := v_shuffled_ids[v_swap_idx];
                v_shuffled_ids[v_swap_idx] := v_temp_id;
            END IF;
            v_player_idx := v_player_idx + v_ppm;
        END LOOP;
        EXIT WHEN NOT v_has_conflict;
        v_attempts := v_attempts + 1;
    END LOOP;

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

-- 12. Get Matches
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 13. Get Standings
DROP FUNCTION IF EXISTS tournament.get_standings(TEXT);
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
    is_present BOOLEAN,
    joined_at TIMESTAMPTZ
) AS $$
DECLARE
    v_tournament_id UUID;
BEGIN
    SELECT t.id INTO v_tournament_id FROM tournament.tournaments t WHERE t.slug = slug_param;
    
    RETURN QUERY
    SELECT 
        p.id, p.tournament_id, 
        p.user_id, 
        p.username, p.avatar,
        COALESCE((SELECT SUM((m.scores->>p.id::text)::integer) FROM tournament.matches m WHERE m.tournament_id = v_tournament_id AND (m.player1_id = p.id OR m.player2_id = p.id OR m.player3_id = p.id OR m.player4_id = p.id) AND m.status = 'finished'), 0)::BIGINT as points,
        COALESCE((SELECT COUNT(*) FROM tournament.matches m WHERE m.tournament_id = v_tournament_id AND (SELECT key::uuid FROM jsonb_each_text(m.scores) ORDER BY value::integer DESC LIMIT 1) = p.id AND m.status = 'finished'), 0)::BIGINT as wins,
        COALESCE((SELECT COUNT(*) FROM tournament.matches m WHERE m.tournament_id = v_tournament_id AND (m.player1_id = p.id OR m.player2_id = p.id OR m.player3_id = p.id OR m.player4_id = p.id) AND EXISTS (SELECT 1 FROM jsonb_each_text(m.scores)) AND (SELECT key::uuid FROM jsonb_each_text(m.scores) ORDER BY value::integer DESC LIMIT 1) != p.id AND m.status = 'finished'), 0)::BIGINT as losses,
        COALESCE((SELECT ROUND(AVG((m.scores->>p.id::text)::integer), 2) FROM tournament.matches m WHERE m.tournament_id = v_tournament_id AND (m.player1_id = p.id OR m.player2_id = p.id OR m.player3_id = p.id OR m.player4_id = p.id) AND m.status = 'finished'), 0)::NUMERIC as average,
        p.is_present, p.joined_at
    FROM tournament.participants p
    WHERE p.tournament_id = v_tournament_id
    ORDER BY points DESC, average DESC, p.joined_at ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 14. Advance Tournament
DROP FUNCTION IF EXISTS tournament.advance_tournament(TEXT, TEXT);
CREATE OR REPLACE FUNCTION tournament.advance_tournament(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := public.get_internal_user_id(admin_clerk_id);
    v_tournament_id UUID;
    v_actual_admin_id UUID;
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
    SELECT t.id, t.admin_user_id, t.format, t.players_per_match, t.league_match_count, t.advance_count, t.current_league_round, t.status
    INTO v_tournament_id, v_actual_admin_id, v_format, v_ppm, v_league_rounds, v_advance_count, v_current_league_round, v_current_status
    FROM tournament.tournaments t WHERE t.slug = slug_param;

    IF v_tournament_id IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
    IF v_actual_admin_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;
    
    v_ppm := COALESCE(v_ppm, 2);

    IF v_current_league_round > 0 THEN
        SELECT COUNT(*) INTO v_unfinished_count FROM tournament.matches WHERE tournament_id = v_tournament_id AND phase = 'league' AND round = v_current_league_round AND status != 'finished';
        IF v_unfinished_count > 0 THEN RAISE EXCEPTION 'Current round has unfinished matches'; END IF;

        IF v_current_league_round < v_league_rounds THEN
            SELECT COUNT(*) INTO v_participant_count FROM tournament.participants WHERE tournament_id = v_tournament_id;
            SELECT array_agg(id ORDER BY random()) INTO v_shuffled_ids FROM tournament.participants WHERE tournament_id = v_tournament_id;
            FOR v_player_idx IN 1..v_participant_count BY v_ppm LOOP
                IF v_player_idx + 1 <= v_participant_count THEN
                    INSERT INTO tournament.matches (tournament_id, phase, round, status, player1_id, player2_id, player3_id, player4_id)
                    VALUES (v_tournament_id, 'league', v_current_league_round + 1, 'playing', v_shuffled_ids[v_player_idx], v_shuffled_ids[v_player_idx + 1], CASE WHEN v_ppm >= 3 AND v_player_idx + 2 <= v_participant_count THEN v_shuffled_ids[v_player_idx + 2] ELSE NULL END, CASE WHEN v_ppm >= 4 AND v_player_idx + 3 <= v_participant_count THEN v_shuffled_ids[v_player_idx + 3] ELSE NULL END);
                END IF;
            END LOOP;
            UPDATE tournament.tournaments SET current_league_round = v_current_league_round + 1 WHERE id = v_tournament_id;
            RETURN TRUE;
        ELSE
            SELECT array_agg(sub.id) INTO v_winners FROM (SELECT p.id FROM tournament.get_standings(slug_param) p LIMIT v_advance_count) sub;
            v_winner_count := COALESCE(array_length(v_winners, 1), 0);
            FOR v_player_idx IN 1..v_winner_count BY v_ppm LOOP
                IF v_player_idx + 1 <= v_winner_count THEN
                    INSERT INTO tournament.matches (tournament_id, phase, round, status, player1_id, player2_id, player3_id, player4_id)
                    VALUES (v_tournament_id, 'bracket', 1, 'playing', v_winners[v_player_idx], v_winners[v_player_idx + 1], CASE WHEN v_ppm >= 3 AND v_player_idx + 2 <= v_winner_count THEN v_winners[v_player_idx + 2] ELSE NULL END, CASE WHEN v_ppm >= 4 AND v_player_idx + 3 <= v_winner_count THEN v_winners[v_player_idx + 3] ELSE NULL END);
                END IF;
            END LOOP;
            UPDATE tournament.tournaments SET current_league_round = 0 WHERE id = v_tournament_id;
            RETURN TRUE;
        END IF;
    END IF;

    SELECT COALESCE(MAX(round), 0) INTO v_bracket_round FROM tournament.matches WHERE tournament_id = v_tournament_id AND phase = 'bracket';
    SELECT COUNT(*) INTO v_unfinished_count FROM tournament.matches WHERE tournament_id = v_tournament_id AND phase = 'bracket' AND round = v_bracket_round AND status != 'finished';
    IF v_unfinished_count > 0 THEN RAISE EXCEPTION 'Current bracket round has unfinished matches'; END IF;

    SELECT array_agg(sub.winner_id ORDER BY sub.created_at ASC) INTO v_winners
    FROM (SELECT (SELECT key::uuid FROM jsonb_each_text(m.scores) ORDER BY value::integer DESC LIMIT 1) as winner_id, m.created_at FROM tournament.matches m WHERE m.tournament_id = v_tournament_id AND m.phase = 'bracket' AND m.round = v_bracket_round) sub;

    v_winner_count := COALESCE(array_length(v_winners, 1), 0);
    IF v_winner_count = 0 THEN RAISE EXCEPTION 'No winners found to advance'; END IF;
    IF v_winner_count = 1 THEN UPDATE tournament.tournaments SET status = 'completed' WHERE id = v_tournament_id; RETURN TRUE; END IF;

    FOR v_player_idx IN 1..v_winner_count BY v_ppm LOOP
        IF v_player_idx + 1 <= v_winner_count THEN
            INSERT INTO tournament.matches (tournament_id, phase, round, status, player1_id, player2_id, player3_id, player4_id)
            VALUES (v_tournament_id, 'bracket', v_bracket_round + 1, 'playing', v_winners[v_player_idx], v_winners[v_player_idx + 1], CASE WHEN v_ppm >= 3 AND v_player_idx + 2 <= v_winner_count THEN v_winners[v_player_idx + 2] ELSE NULL END, CASE WHEN v_ppm >= 4 AND v_player_idx + 3 <= v_winner_count THEN v_winners[v_player_idx + 3] ELSE NULL END);
        END IF;
    END LOOP;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Auto Score Round
DROP FUNCTION IF EXISTS tournament.auto_score_round(TEXT, TEXT);
CREATE OR REPLACE FUNCTION tournament.auto_score_round(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tournament_id UUID;
    v_admin_id UUID := public.get_internal_user_id(admin_clerk_id);
    v_actual_admin_id UUID;
    v_current_round INTEGER;
    v_phase TEXT;
    v_match_record RECORD;
    v_scores JSONB;
BEGIN
    SELECT id, admin_user_id, current_league_round INTO v_tournament_id, v_actual_admin_id, v_current_round FROM tournament.tournaments WHERE slug = slug_param;
    IF v_actual_admin_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;

    IF v_current_round > 0 THEN v_phase := 'league'; ELSE SELECT COALESCE(MAX(round), 0) INTO v_current_round FROM tournament.matches WHERE tournament_id = v_tournament_id AND phase = 'bracket'; v_phase := 'bracket'; END IF;

    FOR v_match_record IN SELECT id, player1_id, player2_id, player3_id, player4_id FROM tournament.matches WHERE tournament_id = v_tournament_id AND phase = v_phase AND round = v_current_round AND status != 'finished' LOOP
        v_scores := jsonb_build_object(v_match_record.player1_id::TEXT, floor(random() * 11), v_match_record.player2_id::TEXT, floor(random() * 11));
        IF v_match_record.player3_id IS NOT NULL THEN v_scores := v_scores || jsonb_build_object(v_match_record.player3_id::TEXT, floor(random() * 11)); END IF;
        IF v_match_record.player4_id IS NOT NULL THEN v_scores := v_scores || jsonb_build_object(v_match_record.player4_id::TEXT, floor(random() * 11)); END IF;
        PERFORM tournament.update_match_score(v_match_record.id, v_scores);
    END LOOP;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Reset Tournament
DROP FUNCTION IF EXISTS tournament.reset_tournament(TEXT, TEXT);
CREATE OR REPLACE FUNCTION tournament.reset_tournament(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := public.get_internal_user_id(admin_clerk_id);
    v_tournament_id UUID;
    v_actual_admin_id UUID;
BEGIN
    SELECT id, admin_user_id INTO v_tournament_id, v_actual_admin_id FROM tournament.tournaments WHERE slug = slug_param;
    IF v_tournament_id IS NULL THEN RETURN FALSE; END IF;
    IF v_actual_admin_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;

    DELETE FROM tournament.matches WHERE tournament_id = v_tournament_id;
    UPDATE tournament.tournaments SET status = 'upcoming', current_league_round = 1, start_at = NULL WHERE id = v_tournament_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Reset Round
DROP FUNCTION IF EXISTS tournament.reset_round(TEXT, TEXT);
CREATE OR REPLACE FUNCTION tournament.reset_round(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := public.get_internal_user_id(admin_clerk_id);
    v_tournament tournament.tournaments;
    v_round INTEGER;
    v_phase TEXT;
BEGIN
    SELECT * INTO v_tournament FROM tournament.tournaments WHERE slug = slug_param;
    IF v_tournament.id IS NULL THEN RETURN FALSE; END IF;
    IF v_tournament.admin_user_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;

    v_round := v_tournament.current_league_round;
    v_phase := 'league';
    IF v_round = 0 THEN SELECT round INTO v_round FROM tournament.matches WHERE tournament_id = v_tournament.id AND phase = 'bracket' ORDER BY round DESC LIMIT 1; v_phase := 'bracket'; END IF;

    IF v_round IS NULL OR v_round = 0 THEN RETURN FALSE; END IF;
    UPDATE tournament.matches SET scores = '{}', status = 'upcoming' WHERE tournament_id = v_tournament.id AND phase = v_phase AND round = v_round;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Clear Participants
DROP FUNCTION IF EXISTS tournament.clear_participants(TEXT, TEXT);
CREATE OR REPLACE FUNCTION tournament.clear_participants(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := public.get_internal_user_id(admin_clerk_id);
    v_tournament_id UUID;
    v_actual_admin_id UUID;
BEGIN
    SELECT id, admin_user_id INTO v_tournament_id, v_actual_admin_id FROM tournament.tournaments WHERE slug = slug_param;
    IF v_tournament_id IS NULL THEN RETURN FALSE; END IF;
    IF v_actual_admin_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;
    
    DELETE FROM tournament.participants WHERE tournament_id = v_tournament_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Save Manual Matches
DROP FUNCTION IF EXISTS tournament.tournament_save_manual_matches(TEXT, INT, JSONB);
CREATE OR REPLACE FUNCTION tournament.tournament_save_manual_matches(
    p_slug TEXT,
    p_round INT,
    p_matches JSONB
) RETURNS JSONB AS $$
DECLARE
    v_match JSONB;
BEGIN
    FOR v_match IN SELECT * FROM jsonb_array_elements(p_matches) LOOP
        UPDATE tournament.matches 
        SET player1_id = NULLIF((v_match->>'player1_id'), '')::UUID,
            player2_id = NULLIF((v_match->>'player2_id'), '')::UUID,
            player3_id = NULLIF((v_match->>'player3_id'), '')::UUID,
            player4_id = NULLIF((v_match->>'player4_id'), '')::UUID
        WHERE id = (v_match->>'match_id')::UUID;
    END LOOP;
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tournament TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tournament GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
