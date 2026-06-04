DROP FUNCTION IF EXISTS tasarruf_challenges.update_post(UUID, TEXT, TEXT, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION tasarruf_challenges.update_post(
    p_post_id UUID,
    p_user_id TEXT,
    p_description TEXT,
    p_amount NUMERIC,
    p_category TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE tasarruf_challenges.posts
    SET description = p_description,
        amount = p_amount,
        category = p_category
    WHERE id = p_post_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;
