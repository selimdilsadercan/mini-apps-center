DROP FUNCTION IF EXISTS kim_gelir.respond_to_activity;

CREATE OR REPLACE FUNCTION kim_gelir.respond_to_activity(
    p_activity_id UUID,
    p_user_id TEXT,
    p_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO kim_gelir.activity_invites (
        activity_id,
        user_id,
        status,
        updated_at
    ) VALUES (
        p_activity_id,
        p_user_id,
        p_status,
        NOW()
    )
    ON CONFLICT (activity_id, user_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        updated_at = NOW();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
