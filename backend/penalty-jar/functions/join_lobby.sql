DROP FUNCTION IF EXISTS penalty_jar.join_lobby;

CREATE OR REPLACE FUNCTION penalty_jar.join_lobby(
    p_user_id TEXT,
    p_join_code TEXT
)
RETURNS UUID AS $$
DECLARE
    v_lobby_id UUID;
    v_point_start INT;
BEGIN
    -- Find lobby and get its starting points
    SELECT id, point_start INTO v_lobby_id, v_point_start
    FROM penalty_jar.lobbies
    WHERE UPPER(join_code) = UPPER(p_join_code);

    IF v_lobby_id IS NULL THEN
        RAISE EXCEPTION 'Lobby not found';
    END IF;

    -- Add member if not already in
    INSERT INTO penalty_jar.lobby_members (
        lobby_id,
        user_id,
        points,
        money_owed,
        role
    ) VALUES (
        v_lobby_id,
        p_user_id,
        v_point_start,
        0,
        'member'
    ) ON CONFLICT (lobby_id, user_id) DO NOTHING;

    RETURN v_lobby_id;
END;
$$ LANGUAGE plpgsql;
