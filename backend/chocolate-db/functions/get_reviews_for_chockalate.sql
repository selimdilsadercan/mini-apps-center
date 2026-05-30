DROP FUNCTION IF EXISTS chocolate_db.get_reviews_for_chocolate;

CREATE OR REPLACE FUNCTION chocolate_db.get_reviews_for_chocolate(p_chocolate_id TEXT)
RETURNS TABLE (
    id UUID,
    rating INTEGER,
    comment TEXT,
    reviewer_name TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        r.id,
        r.rating,
        r.comment,
        r.reviewer_name,
        r.created_at
    FROM chocolate_db.reviews r
    WHERE r.chocolate_id = p_chocolate_id
    ORDER BY r.created_at DESC;
$$;
