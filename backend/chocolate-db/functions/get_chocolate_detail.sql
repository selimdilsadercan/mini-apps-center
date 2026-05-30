DROP FUNCTION IF EXISTS chocolate_db.get_chocolate_detail(UUID);
DROP FUNCTION IF EXISTS chocolate_db.get_chocolate_detail(TEXT);

-- Legacy RPC: product metadata is served from products.json; this returns review stats only.
CREATE OR REPLACE FUNCTION chocolate_db.get_chocolate_detail(p_id TEXT)
RETURNS TABLE (
    id TEXT,
    avg_rating DECIMAL,
    review_count INTEGER,
    reviews JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p_id AS id,
        COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS avg_rating,
        COUNT(r.id)::INTEGER AS review_count,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'rating', r.rating,
                    'comment', r.comment,
                    'reviewer_name', r.reviewer_name,
                    'created_at', r.created_at
                ) ORDER BY r.created_at DESC
            ),
            '[]'::jsonb
        ) AS reviews
    FROM chocolate_db.reviews r
    WHERE r.chocolate_id = p_id;
END;
$$;
