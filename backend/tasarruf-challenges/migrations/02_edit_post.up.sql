-- Migration to add update_post function for editing savings posts
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
BEGINa
    UPDATE tasarruf_challenges.posts
    SET description = p_description,
        amount = p_amount,
        category = p_category
    WHERE id = p_post_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Grant permissions to new function
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
