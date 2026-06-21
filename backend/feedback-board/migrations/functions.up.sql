-- FUNCTIONS
-- 1. feedback_board.get_feedbacks
-- 2. feedback_board.add_feedback
-- 3. feedback_board.toggle_vote
-- 4. feedback_board.delete_feedback
-- 5. feedback_board.update_feedback

-- 1. get_feedbacks
DROP FUNCTION IF EXISTS feedback_board.get_feedbacks(TEXT, TEXT);
CREATE OR REPLACE FUNCTION feedback_board.get_feedbacks(
    clerk_id_param TEXT,
    business_id_param TEXT
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    business_id TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    vote_count BIGINT,
    has_voted BOOLEAN,
    is_owner BOOLEAN,
    author_name TEXT,
    author_avatar TEXT
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    
    RETURN QUERY
    SELECT 
        f.id,
        f.user_id,
        f.business_id,
        f.title,
        f.description,
        f.category,
        f.status,
        f.created_at,
        f.updated_at,
        (SELECT COUNT(*) FROM feedback_board.votes v WHERE v.feedback_id = f.id) as vote_count,
        EXISTS(SELECT 1 FROM feedback_board.votes v WHERE v.feedback_id = f.id AND v.user_id = v_user_id) as has_voted,
        (v_user_id IS NOT NULL AND f.user_id = v_user_id) as is_owner,
        u.full_name as author_name,
        u.avatar_url as author_avatar
    FROM feedback_board.feedbacks f
    LEFT JOIN public.users u ON f.user_id = u.id
    WHERE f.business_id = business_id_param
    ORDER BY vote_count DESC, f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. add_feedback
DROP FUNCTION IF EXISTS feedback_board.add_feedback(TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION feedback_board.add_feedback(
    clerk_id_param TEXT,
    business_id_param TEXT,
    title_param TEXT,
    description_param TEXT,
    category_param TEXT DEFAULT NULL
)
RETURNS feedback_board.feedbacks AS $$
DECLARE
    v_user_id UUID;
    v_new_feedback feedback_board.feedbacks;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO feedback_board.feedbacks (
        user_id, business_id, title, description, category
    ) VALUES (
        v_user_id, business_id_param, title_param, description_param, category_param
    ) RETURNING * INTO v_new_feedback;

    -- Auto vote for own feedback
    INSERT INTO feedback_board.votes (user_id, feedback_id)
    VALUES (v_user_id, v_new_feedback.id);

    RETURN v_new_feedback;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. toggle_vote
DROP FUNCTION IF EXISTS feedback_board.toggle_vote(TEXT, UUID);
CREATE OR REPLACE FUNCTION feedback_board.toggle_vote(
    clerk_id_param TEXT,
    feedback_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM feedback_board.votes 
        WHERE user_id = v_user_id AND feedback_id = feedback_id_param
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM feedback_board.votes 
        WHERE user_id = v_user_id AND feedback_id = feedback_id_param;
        RETURN FALSE;
      ELSE
        INSERT INTO feedback_board.votes (user_id, feedback_id)
        VALUES (v_user_id, feedback_id_param);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. delete_feedback
DROP FUNCTION IF EXISTS feedback_board.delete_feedback(UUID, TEXT);
CREATE OR REPLACE FUNCTION feedback_board.delete_feedback(
    item_id_param UUID,
    clerk_id_param TEXT
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

    DELETE FROM feedback_board.feedbacks
    WHERE id = item_id_param AND user_id = v_user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for all functions to roles
GRANT ALL ON ALL FUNCTIONS IN SCHEMA feedback_board TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA feedback_board GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
