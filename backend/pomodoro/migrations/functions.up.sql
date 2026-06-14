-- FUNCTIONS
-- 1. pomodoro.save_session
-- 2. pomodoro.get_sessions

-- 1. Save Session
DROP FUNCTION IF EXISTS pomodoro.save_session(TEXT, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION pomodoro.save_session(
    p_clerk_id TEXT,
    p_type TEXT,
    p_duration_minutes INTEGER
)
RETURNS pomodoro.sessions AS $$
DECLARE
    v_user_id UUID;
    v_result pomodoro.sessions;
BEGIN
    v_user_id := public.get_internal_user_id(p_clerk_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO pomodoro.sessions (
        user_id,
        type,
        duration_minutes
    ) VALUES (
        v_user_id,
        p_type,
        p_duration_minutes
    ) RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Sessions
DROP FUNCTION IF EXISTS pomodoro.get_sessions(TEXT);
CREATE OR REPLACE FUNCTION pomodoro.get_sessions(
    p_clerk_id TEXT
)
RETURNS SETOF pomodoro.sessions AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_clerk_id);

    RETURN QUERY
    SELECT * FROM pomodoro.sessions
    WHERE user_id = v_user_id
    ORDER BY completed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
