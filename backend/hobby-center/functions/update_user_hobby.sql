-- Drop old function
DROP FUNCTION IF EXISTS hobby_center.update_user_hobby(TEXT, TEXT, TEXT, TEXT, JSONB);

-- RPC: Update or insert user hobby progress
CREATE OR REPLACE FUNCTION hobby_center.update_user_hobby(
    clerk_id_param TEXT,
    hobby_id_param TEXT,
    status_param TEXT,
    notes_param TEXT,
    completed_steps_param JSONB
)
RETURNS SETOF hobby_center.user_hobbies AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Resolve user_id from public.users using clerk_id if available
    SELECT id INTO user_uuid FROM public.users WHERE clerk_id = clerk_id_param LIMIT 1;

    RETURN QUERY
    INSERT INTO hobby_center.user_hobbies (
        user_id,
        clerk_id,
        hobby_id,
        status,
        notes,
        completed_steps,
        updated_at
    )
    VALUES (
        user_uuid,
        clerk_id_param,
        hobby_id_param,
        status_param,
        notes_param,
        completed_steps_param,
        NOW()
    )
    ON CONFLICT (clerk_id, hobby_id) DO UPDATE
    SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        completed_steps = EXCLUDED.completed_steps,
        updated_at = NOW()
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
