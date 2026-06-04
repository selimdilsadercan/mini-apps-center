DROP FUNCTION IF EXISTS tasarruf_challenges.get_feed(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION tasarruf_challenges.get_feed(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    user_name TEXT,
    user_image TEXT,
    description TEXT,
    amount NUMERIC,
    category TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.user_name,
        p.user_image,
        p.description,
        p.amount,
        p.category,
        p.created_at
    FROM tasarruf_challenges.posts p
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
