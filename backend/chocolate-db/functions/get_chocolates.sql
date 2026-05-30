DROP FUNCTION IF EXISTS chocolate_db.get_chocolates;

CREATE OR REPLACE FUNCTION chocolate_db.get_chocolates()
RETURNS TABLE (
    chocolate_id TEXT,
    avg_rating NUMERIC,
    review_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        r.chocolate_id,
        COALESCE(AVG(r.rating), 0)::NUMERIC as avg_rating,
        COUNT(r.id)::BIGINT as review_count
    FROM chocolate_db.reviews r
    GROUP BY r.chocolate_id;
$$;
