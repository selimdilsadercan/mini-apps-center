DROP FUNCTION IF EXISTS chocolate_db.get_chocolates;

CREATE OR REPLACE FUNCTION chocolate_db.get_chocolates(p_clerk_id TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    brand TEXT,
    description TEXT,
    image_url TEXT,
    avg_rating DECIMAL(3, 2),
    review_count INTEGER,
    created_at TIMESTAMPTZ,
    user_state TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.brand,
        c.description,
        c.image_url,
        c.avg_rating,
        c.review_count,
        c.created_at,
        us.state AS user_state
    FROM chocolate_db.chocolates c
    LEFT JOIN chocolate_db.user_states us ON us.chocolate_id = c.id AND us.clerk_id = p_clerk_id
    ORDER BY c.avg_rating DESC, c.name ASC;
END;
$$;
