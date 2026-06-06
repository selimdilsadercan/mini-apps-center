DROP FUNCTION IF EXISTS penalty_jar.report_infraction;

CREATE OR REPLACE FUNCTION penalty_jar.report_infraction(
    p_lobby_id UUID,
    p_reported_user_id TEXT,
    p_reporter_user_id TEXT,
    p_rule_name TEXT,
    p_penalty_amount NUMERIC,
    p_is_self_report BOOLEAN
)
RETURNS UUID AS $$
DECLARE
    v_infraction_id UUID;
    v_status TEXT := 'pending';
    v_penalty_type TEXT;
BEGIN
    IF p_is_self_report THEN
        v_status := 'approved';
    END IF;

    -- Insert infraction
    INSERT INTO penalty_jar.infractions (
        lobby_id,
        reported_user_id,
        reporter_user_id,
        rule_name,
        penalty_amount,
        is_self_report,
        status
    ) VALUES (
        p_lobby_id,
        p_reported_user_id,
        p_reporter_user_id,
        p_rule_name,
        p_penalty_amount,
        p_is_self_report,
        v_status
    ) RETURNING id INTO v_infraction_id;

    -- If self-report, apply penalty immediately
    IF p_is_self_report THEN
        SELECT penalty_type INTO v_penalty_type FROM penalty_jar.lobbies WHERE id = p_lobby_id;
        
        IF v_penalty_type = 'points' THEN
            UPDATE penalty_jar.lobby_members
            SET points = GREATEST(0, points - p_penalty_amount::INT)
            WHERE lobby_id = p_lobby_id AND user_id = p_reported_user_id;
        ELSE
            UPDATE penalty_jar.lobby_members
            SET money_owed = money_owed + p_penalty_amount
            WHERE lobby_id = p_lobby_id AND user_id = p_reported_user_id;
        END IF;
    END IF;

    RETURN v_infraction_id;
END;
$$ LANGUAGE plpgsql;
