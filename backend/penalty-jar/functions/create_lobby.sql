DROP FUNCTION IF EXISTS penalty_jar.create_lobby;

CREATE OR REPLACE FUNCTION penalty_jar.create_lobby(
    p_creator_id TEXT,
    p_name TEXT,
    p_penalty_type TEXT,
    p_currency TEXT,
    p_point_start INT,
    p_penalty_amount NUMERIC,
    p_rules JSONB,
    p_join_code TEXT
)
RETURNS UUID AS $$
DECLARE
    v_lobby_id UUID;
BEGIN
    -- Insert the lobby
    INSERT INTO penalty_jar.lobbies (
        join_code,
        creator_id,
        name,
        penalty_type,
        currency,
        point_start,
        penalty_amount,
        rules
    ) VALUES (
        p_join_code,
        p_creator_id,
        p_name,
        p_penalty_type,
        p_currency,
        p_point_start,
        p_penalty_amount,
        p_rules
    ) RETURNING id INTO v_lobby_id;

    -- Add creator as member
    INSERT INTO penalty_jar.lobby_members (
        lobby_id,
        user_id,
        points,
        money_owed,
        role
    ) VALUES (
        v_lobby_id,
        p_creator_id,
        p_point_start,
        0,
        'creator'
    );

    RETURN v_lobby_id;
END;
$$ LANGUAGE plpgsql;
