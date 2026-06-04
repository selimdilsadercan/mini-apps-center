DROP FUNCTION IF EXISTS tasarruf_challenges.create_post(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION tasarruf_challenges.create_post(
    p_user_id TEXT,
    p_user_name TEXT,
    p_user_image TEXT,
    p_description TEXT,
    p_amount NUMERIC,
    p_category TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_post_id UUID;
BEGIN
    INSERT INTO tasarruf_challenges.posts (user_id, user_name, user_image, description, amount, category)
    VALUES (p_user_id, p_user_name, p_user_image, p_description, p_amount, p_category)
    RETURNING id INTO v_post_id;
    
    RETURN v_post_id;
END;
$$;
