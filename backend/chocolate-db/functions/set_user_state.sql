DROP FUNCTION IF EXISTS chocolate_db.set_user_state;

CREATE OR REPLACE FUNCTION chocolate_db.set_user_state(
    p_clerk_id TEXT,
    p_chocolate_id UUID,
    p_state TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_state IS NULL OR p_state = '' THEN
        DELETE FROM chocolate_db.user_states
        WHERE clerk_id = p_clerk_id AND chocolate_id = p_chocolate_id;
    ELSE
        INSERT INTO chocolate_db.user_states (clerk_id, chocolate_id, state, updated_at)
        VALUES (p_clerk_id, p_chocolate_id, p_state, now())
        ON CONFLICT (clerk_id, chocolate_id)
        DO UPDATE SET state = EXCLUDED.state, updated_at = now();
    END IF;
END;
$$;
