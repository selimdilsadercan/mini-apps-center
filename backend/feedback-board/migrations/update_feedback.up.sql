-- 6. update_feedback (author only)
DROP FUNCTION IF EXISTS feedback_board.update_feedback(TEXT, UUID, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION feedback_board.update_feedback(
    clerk_id_param TEXT,
    feedback_id_param UUID,
    title_param TEXT,
    description_param TEXT,
    category_param TEXT DEFAULT NULL
)
RETURNS feedback_board.feedbacks AS $$
DECLARE
    v_user_id UUID;
    v_updated feedback_board.feedbacks;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE feedback_board.feedbacks
    SET
        title = title_param,
        description = description_param,
        category = category_param,
        updated_at = NOW()
    WHERE id = feedback_id_param AND user_id = v_user_id
    RETURNING * INTO v_updated;

    IF v_updated IS NULL THEN
        RAISE EXCEPTION 'Feedback not found or not authorized';
    END IF;

    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT ALL ON ALL FUNCTIONS IN SCHEMA feedback_board TO anon, authenticated, service_role;
