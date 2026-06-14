-- ChocolateDB RPC Functions

-- 1. get_chocolates
DROP FUNCTION IF EXISTS chocolate_db.get_chocolates(TEXT);

CREATE OR REPLACE FUNCTION chocolate_db.get_chocolates(p_clerk_id TEXT)
RETURNS TABLE (
    id TEXT,
    avg_rating DECIMAL(3, 2),
    review_count INTEGER,
    user_state TEXT,
    user_rating INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_clerk_id);

    RETURN QUERY
    WITH chocolate_ids AS (
        SELECT DISTINCT r.chocolate_id
        FROM chocolate_db.reviews r
        UNION
        SELECT DISTINCT us.chocolate_id
        FROM chocolate_db.user_states us
        WHERE us.user_id = v_user_id
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
        us.state AS user_state,
        (SELECT r.rating FROM chocolate_db.reviews r WHERE r.chocolate_id = cid.chocolate_id AND r.user_id = v_user_id LIMIT 1)::INTEGER AS user_rating
    FROM chocolate_ids cid
    LEFT JOIN review_stats rs ON rs.chocolate_id = cid.chocolate_id
    LEFT JOIN chocolate_db.user_states us
        ON us.chocolate_id = cid.chocolate_id AND us.user_id = v_user_id
    ORDER BY avg_rating DESC, id ASC;
END;
$$;

-- 2. add_review
DROP FUNCTION IF EXISTS chocolate_db.add_review(TEXT, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION chocolate_db.add_review(
    p_chocolate_id TEXT,
    p_rating INTEGER,
    p_comment TEXT,
    p_reviewer_name TEXT,
    p_clerk_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_clerk_id);

    INSERT INTO chocolate_db.reviews (chocolate_id, rating, comment, reviewer_name, user_id)
    VALUES (p_chocolate_id, p_rating, p_comment, p_reviewer_name, v_user_id)
    ON CONFLICT (user_id, chocolate_id) 
    DO UPDATE SET 
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        reviewer_name = EXCLUDED.reviewer_name,
        created_at = now();
END;
$$;

-- 3. set_user_state
DROP FUNCTION IF EXISTS chocolate_db.set_user_state(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION chocolate_db.set_user_state(
    p_clerk_id TEXT,
    p_chocolate_id TEXT,
    p_state TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_clerk_id);

    IF p_state IS NULL OR p_state = '' THEN
        DELETE FROM chocolate_db.user_states
        WHERE user_id = v_user_id AND chocolate_id = p_chocolate_id;
    ELSE
        INSERT INTO chocolate_db.user_states (user_id, chocolate_id, state, updated_at)
        VALUES (v_user_id, p_chocolate_id, p_state, now())
        ON CONFLICT (user_id, chocolate_id)
        DO UPDATE SET state = EXCLUDED.state, updated_at = now();
    END IF;
END;
$$;

-- 4. get_chocolate_detail
DROP FUNCTION IF EXISTS chocolate_db.get_chocolate_detail(TEXT);

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

-- 5. get_reviews_for_chocolate
DROP FUNCTION IF EXISTS chocolate_db.get_reviews_for_chocolate(TEXT);

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

-- 6. delete_review
DROP FUNCTION IF EXISTS chocolate_db.delete_review(TEXT, TEXT);

CREATE OR REPLACE FUNCTION chocolate_db.delete_review(
    p_chocolate_id TEXT,
    p_clerk_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_clerk_id);

    DELETE FROM chocolate_db.reviews 
    WHERE chocolate_id = p_chocolate_id AND user_id = v_user_id;
END;
$$;

-- 7. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA chocolate_db TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
