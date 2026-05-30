DROP FUNCTION IF EXISTS chocolate_db.get_chocolates(TEXT);

CREATE OR REPLACE FUNCTION chocolate_db.get_chocolates(p_clerk_id TEXT)
RETURNS TABLE (
    id TEXT,
    avg_rating DECIMAL(3, 2),
    review_count INTEGER,
    user_state TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH chocolate_ids AS (
        SELECT DISTINCT r.chocolate_id
        FROM chocolate_db.reviews r
        UNION
        SELECT DISTINCT us.chocolate_id
        FROM chocolate_db.user_states us
        WHERE us.clerk_id = p_clerk_id
    ),
    review_stats AS (
        SELECT
            r.chocolate_id,
            COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0)::DECIMAL(3, 2) AS avg_rating,
            COUNT(*)::INTEGER AS review_count
        FROM chocolate_db.reviews r
        GROUP BY r.chocolate_id
    )
    SELECT
        cid.chocolate_id AS id,
        COALESCE(rs.avg_rating, 0::DECIMAL(3, 2)) AS avg_rating,
        COALESCE(rs.review_count, 0) AS review_count,
        us.state AS user_state
    FROM chocolate_ids cid
    LEFT JOIN review_stats rs ON rs.chocolate_id = cid.chocolate_id
    LEFT JOIN chocolate_db.user_states us
        ON us.chocolate_id = cid.chocolate_id AND us.clerk_id = p_clerk_id
    ORDER BY avg_rating DESC, id ASC;
END;
$$;
