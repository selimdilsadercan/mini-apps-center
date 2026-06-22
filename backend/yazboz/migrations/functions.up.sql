-- FUNCTIONS
-- 1. yazboz.get_players
-- 2. yazboz.create_player
-- 3. yazboz.update_player
-- 4. yazboz.delete_player
-- 5. yazboz.create_game_save
-- 6. yazboz.get_game_saves
-- 7. yazboz.get_game_save_by_id
-- 8. yazboz.delete_game_save
-- 9. yazboz.update_game_save

-- 1. Get Players
DROP FUNCTION IF EXISTS yazboz.get_players(TEXT);
CREATE OR REPLACE FUNCTION yazboz.get_players(clerk_id_param TEXT)
RETURNS SETOF yazboz.players AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT * FROM yazboz.players
    WHERE owner_user_id = v_user_id
    ORDER BY name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Player
DROP FUNCTION IF EXISTS yazboz.create_player(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION yazboz.create_player(
    clerk_id_param TEXT,
    name_param TEXT,
    initial_param TEXT
)
RETURNS yazboz.players AS $$
DECLARE
    v_user_id UUID;
    v_new_player yazboz.players;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO yazboz.players (
        owner_user_id, name, initial
    ) VALUES (
        v_user_id, name_param, initial_param
    ) RETURNING * INTO v_new_player;

    RETURN v_new_player;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Player
DROP FUNCTION IF EXISTS yazboz.update_player(TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION yazboz.update_player(
    clerk_id_param TEXT,
    player_id_param TEXT,
    name_param TEXT,
    initial_param TEXT
)
RETURNS yazboz.players AS $$
DECLARE
    v_user_id UUID;
    v_updated_player yazboz.players;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE yazboz.players
    SET name = name_param,
        initial = initial_param
    WHERE id = player_id_param AND owner_user_id = v_user_id
    RETURNING * INTO v_updated_player;

    RETURN v_updated_player;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Delete Player
DROP FUNCTION IF EXISTS yazboz.delete_player(TEXT, TEXT);
CREATE OR REPLACE FUNCTION yazboz.delete_player(
    clerk_id_param TEXT,
    player_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    deleted_count INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    DELETE FROM yazboz.players
    WHERE id = player_id_param AND owner_user_id = v_user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create Game Save
DROP FUNCTION IF EXISTS yazboz.create_game_save(TEXT, TEXT, TEXT, JSONB, JSONB, JSONB);
CREATE OR REPLACE FUNCTION yazboz.create_game_save(
    clerk_id_param TEXT,
    name_param TEXT,
    game_template_param TEXT,
    players_param JSONB,
    settings_param JSONB,
    state_param JSONB
)
RETURNS yazboz.game_saves AS $$
DECLARE
    v_user_id UUID;
    v_new_save yazboz.game_saves;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO yazboz.game_saves (
        owner_user_id, name, game_template, players, settings, state
    ) VALUES (
        v_user_id, name_param, game_template_param, players_param, settings_param, state_param
    ) RETURNING * INTO v_new_save;

    RETURN v_new_save;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Get Game Saves
DROP FUNCTION IF EXISTS yazboz.get_game_saves(TEXT);
CREATE OR REPLACE FUNCTION yazboz.get_game_saves(clerk_id_param TEXT)
RETURNS SETOF yazboz.game_saves AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT * FROM yazboz.game_saves
    WHERE owner_user_id = v_user_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Get Game Save By Id
DROP FUNCTION IF EXISTS yazboz.get_game_save_by_id(TEXT, TEXT);
CREATE OR REPLACE FUNCTION yazboz.get_game_save_by_id(
    clerk_id_param TEXT,
    save_id_param TEXT
)
RETURNS yazboz.game_saves AS $$
DECLARE
    v_user_id UUID;
    v_save yazboz.game_saves;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT * INTO v_save FROM yazboz.game_saves
    WHERE id = save_id_param AND owner_user_id = v_user_id;

    RETURN v_save;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Delete Game Save
DROP FUNCTION IF EXISTS yazboz.delete_game_save(TEXT, TEXT);
CREATE OR REPLACE FUNCTION yazboz.delete_game_save(
    clerk_id_param TEXT,
    save_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    deleted_count INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    DELETE FROM yazboz.game_saves
    WHERE id = save_id_param AND owner_user_id = v_user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Update Game Save
DROP FUNCTION IF EXISTS yazboz.update_game_save(TEXT, TEXT, TEXT, JSONB, JSONB, JSONB);
CREATE OR REPLACE FUNCTION yazboz.update_game_save(
    clerk_id_param TEXT,
    save_id_param TEXT,
    name_param TEXT,
    players_param JSONB,
    settings_param JSONB,
    state_param JSONB
)
RETURNS yazboz.game_saves AS $$
DECLARE
    v_user_id UUID;
    v_updated_save yazboz.game_saves;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE yazboz.game_saves
    SET name = COALESCE(name_param, name),
        players = COALESCE(players_param, players),
        settings = COALESCE(settings_param, settings),
        state = COALESCE(state_param, state)
    WHERE id = save_id_param AND owner_user_id = v_user_id
    RETURNING * INTO v_updated_save;

    RETURN v_updated_save;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
