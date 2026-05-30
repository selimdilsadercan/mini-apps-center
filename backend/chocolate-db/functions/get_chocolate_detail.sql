DROP FUNCTION IF EXISTS chocolate_db.get_chocolate_detail;

CREATE OR REPLACE FUNCTION chocolate_db.get_chocolate_detail(p_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    brand TEXT,
    description_tr TEXT,
    description_en TEXT,
    image_url TEXT,
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
        c.id, 
        c.name, 
        c.brand, 
        c.description_tr, 
        c.description_en, 
        c.image_url, 
        c.avg_rating, 
        c.review_count,
        COALESCE(
            (SELECT jsonb_agg(r ORDER BY r.created_at DESC) 
             FROM chocolate_db.reviews r 
             WHERE r.chocolate_id = c.id),
            '[]'::jsonb
        ) as reviews
    FROM chocolate_db.chocolates c
    WHERE c.id = p_id;
END;
$$;
