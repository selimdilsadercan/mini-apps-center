-- get_place: city, types, business_id kolonlarını ve yerel puanları döndür
DROP FUNCTION IF EXISTS workplaces.get_place(UUID);
CREATE OR REPLACE FUNCTION workplaces.get_place(p_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    note TEXT,
    url TEXT,
    tags TEXT[],
    wifi BOOLEAN,
    parking BOOLEAN,
    power_outlets BOOLEAN,
    quiet_level INTEGER,
    user_id UUID,
    latitude NUMERIC,
    longitude NUMERIC,
    district TEXT,
    image_url TEXT,
    address TEXT,
    rating NUMERIC,
    user_ratings_total INTEGER,
    internal_rating NUMERIC,
    internal_review_count INTEGER,
    metadata JSONB,
    approved BOOLEAN,
    business_id TEXT,
    city TEXT,
    types TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.note, p.url, p.tags, p.wifi, p.parking, p.power_outlets, p.quiet_level, 
        p.user_id, p.latitude, p.longitude, p.district, p.image_url, p.address, p.rating, 
        p.user_ratings_total,
        r.avg_rating::NUMERIC as internal_rating,
        r.count_rating::INTEGER as internal_review_count,
        p.metadata, p.approved, p.business_id, p.city, p.types,
        p.created_at, p.updated_at
    FROM workplaces.places p
    LEFT JOIN (
        SELECT place_id, AVG(overall) as avg_rating, COUNT(*) as count_rating
        FROM workplaces.place_ratings
        GROUP BY place_id
    ) r ON p.id = r.place_id
    WHERE p.id = p_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
