-- FUNCTIONS
-- 1. iskambil.get_user_game_states
-- 2. iskambil.toggle_favorite
-- 3. iskambil.toggle_known
-- 4. iskambil.save_note

-- 1. Get User Game States
DROP FUNCTION IF EXISTS iskambil.get_user_game_states(TEXT);
CREATE OR REPLACE FUNCTION iskambil.get_user_game_states(clerk_id_param TEXT)
RETURNS TABLE (
    favorites TEXT[],
    known_games TEXT[],
    notes JSONB
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        ARRAY(SELECT game_id FROM iskambil.favorites WHERE user_id = v_user_id) as favorites,
        ARRAY(SELECT game_id FROM iskambil.known_games WHERE user_id = v_user_id) as known_games,
        (SELECT jsonb_object_agg(game_id, note) FROM iskambil.notes WHERE user_id = v_user_id) as notes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Toggle Favorite
DROP FUNCTION IF EXISTS iskambil.toggle_favorite(TEXT, TEXT);
CREATE OR REPLACE FUNCTION iskambil.toggle_favorite(clerk_id_param TEXT, game_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM iskambil.favorites 
        WHERE game_id = game_id_param AND user_id = v_user_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM iskambil.favorites 
        WHERE game_id = game_id_param AND user_id = v_user_id;
        RETURN FALSE;
    ELSE
        INSERT INTO iskambil.favorites (game_id, user_id)
        VALUES (game_id_param, v_user_id);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Toggle Known
DROP FUNCTION IF EXISTS iskambil.toggle_known(TEXT, TEXT);
CREATE OR REPLACE FUNCTION iskambil.toggle_known(clerk_id_param TEXT, game_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM iskambil.known_games 
        WHERE game_id = game_id_param AND user_id = v_user_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM iskambil.known_games 
        WHERE game_id = game_id_param AND user_id = v_user_id;
        RETURN FALSE;
    ELSE
        INSERT INTO iskambil.known_games (game_id, user_id)
        VALUES (game_id_param, v_user_id);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Save Note
DROP FUNCTION IF EXISTS iskambil.save_note(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION iskambil.save_note(clerk_id_param TEXT, game_id_param TEXT, note_param TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF note_param IS NULL OR TRIM(note_param) = '' THEN
        DELETE FROM iskambil.notes 
        WHERE game_id = game_id_param AND user_id = v_user_id;
        RETURN NULL;
    ELSE
        INSERT INTO iskambil.notes (game_id, user_id, note, updated_at)
        VALUES (game_id_param, v_user_id, note_param, NOW())
        ON CONFLICT (game_id, user_id) 
        DO UPDATE SET note = EXCLUDED.note, updated_at = NOW();
        RETURN note_param;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
