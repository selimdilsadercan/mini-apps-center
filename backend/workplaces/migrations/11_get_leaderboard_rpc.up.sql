-- Leaderboard: Google Maps rating + IMDB-style weighted score (review count)
DROP FUNCTION IF EXISTS workplaces.get_leaderboard(TEXT, TEXT[], TEXT[], INTEGER);

CREATE OR REPLACE FUNCTION workplaces.get_leaderboard(
    p_city TEXT,
    p_primary_types TEXT[] DEFAULT '{}',
    p_tag_keywords TEXT[] DEFAULT '{}',
    p_limit INTEGER DEFAULT 30
)
RETURNS TABLE (
    place_id UUID,
    name TEXT,
    district TEXT,
    image_url TEXT,
    types TEXT[],
    tags TEXT[],
    average_rating NUMERIC,
    vote_count INTEGER,
    weighted_score NUMERIC
) AS $$
DECLARE
    v_min_votes CONSTANT INTEGER := 10; -- IMDB m: pull low-review places toward category mean
BEGIN
    RETURN QUERY
    WITH filtered_places AS (
        SELECT
            p.id,
            p.name,
            p.district,
            p.image_url,
            p.types,
            p.tags,
            COALESCE(p.rating, 0)::NUMERIC AS google_rating,
            COALESCE(p.user_ratings_total, 0)::INTEGER AS review_count
        FROM workplaces.places p
        WHERE p.city = p_city
          AND p.approved = TRUE
          AND (
              (array_length(p_primary_types, 1) > 0 AND p.types && p_primary_types)
              OR
              (array_length(p_tag_keywords, 1) > 0 AND EXISTS (
                  SELECT 1
                  FROM unnest(p.tags) t
                  CROSS JOIN unnest(p_tag_keywords) kw
                  WHERE lower(trim(t)) = lower(trim(kw))
                     OR lower(t) LIKE '%' || lower(trim(kw)) || '%'
                     OR lower(trim(kw)) LIKE '%' || lower(t) || '%'
              ))
          )
    ),
    category_mean AS (
        SELECT COALESCE(
            AVG(f.google_rating) FILTER (WHERE f.google_rating > 0 AND f.review_count > 0),
            4.0
        )::NUMERIC AS mean_rating
        FROM filtered_places f
    ),
    scored AS (
        SELECT
            f.*,
            CASE
                WHEN f.review_count <= 0 OR f.google_rating <= 0 THEN 0::NUMERIC
                ELSE (
                    (f.review_count::NUMERIC / (f.review_count + v_min_votes)) * f.google_rating
                    + (v_min_votes::NUMERIC / (f.review_count + v_min_votes)) * cm.mean_rating
                )
            END AS weighted_score
        FROM filtered_places f
        CROSS JOIN category_mean cm
    )
    SELECT
        s.id AS place_id,
        s.name,
        s.district,
        s.image_url,
        s.types,
        s.tags,
        ROUND(s.google_rating, 1) AS average_rating,
        s.review_count AS vote_count,
        ROUND(s.weighted_score, 3) AS weighted_score
    FROM scored s
    ORDER BY s.weighted_score DESC, s.review_count DESC, s.name ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION workplaces.get_leaderboard(TEXT, TEXT[], TEXT[], INTEGER) TO anon, authenticated, service_role;
