-- 5. update_feedback_status
DROP FUNCTION IF EXISTS feedback_board.update_feedback_status(TEXT, UUID, TEXT);
CREATE OR REPLACE FUNCTION feedback_board.update_feedback_status(
    clerk_id_param TEXT,
    feedback_id_param UUID,
    status_param TEXT
)
RETURNS feedback_board.feedbacks AS $$
DECLARE
    v_user_id UUID;
    v_business_id TEXT;
    v_updated_feedback feedback_board.feedbacks;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    
    -- Check if the user owns the business associated with this feedback
    SELECT business_id INTO v_business_id FROM feedback_board.feedbacks WHERE id = feedback_id_param;
    
    IF NOT EXISTS (
        SELECT 1 FROM business.businesses 
        WHERE id = v_business_id AND owner_user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only the business owner can update status';
    END IF;

    UPDATE feedback_board.feedbacks
    SET status = status_param,
        updated_at = NOW()
    WHERE id = feedback_id_param
    RETURNING * INTO v_updated_feedback;

    RETURN v_updated_feedback;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions
GRANT ALL ON ALL FUNCTIONS IN SCHEMA feedback_board TO anon, authenticated, service_role;
