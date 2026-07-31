-- Fix ambiguous "id" in add_place RETURN QUERY (PL/pgSQL output column shadowing)

DROP FUNCTION IF EXISTS workplaces.add_place(
  TEXT, TEXT, TEXT, TEXT[], BOOLEAN, BOOLEAN, BOOLEAN, INTEGER,
  TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, INTEGER,
  JSONB, BOOLEAN, TEXT, TEXT, TEXT[]
);

CREATE OR REPLACE FUNCTION workplaces.add_place(
    p_name TEXT,
    p_note TEXT DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT '{}',
    p_wifi BOOLEAN DEFAULT FALSE,
    p_parking BOOLEAN DEFAULT FALSE,
    p_power_outlets BOOLEAN DEFAULT FALSE,
    p_quiet_level INTEGER DEFAULT 3,
    p_user_id TEXT DEFAULT NULL,
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_rating NUMERIC DEFAULT NULL,
    p_user_ratings_total INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_approved BOOLEAN DEFAULT FALSE,
    p_business_id TEXT DEFAULT NULL,
    p_city TEXT DEFAULT 'kahramanmaras',
    p_types TEXT[] DEFAULT '{}'
)
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
#variable_conflict use_column
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_place_id UUID;
BEGIN
    INSERT INTO workplaces.places (
        name, note, url, tags, wifi, parking, power_outlets, quiet_level, user_id,
        latitude, longitude, district, image_url, address, rating, user_ratings_total,
        metadata, approved, business_id, city, types
    ) VALUES (
        p_name, p_note, p_url, p_tags, p_wifi, p_parking, p_power_outlets, p_quiet_level, v_user_id,
        p_latitude, p_longitude, p_district, p_image_url, p_address, p_rating, p_user_ratings_total,
        p_metadata, p_approved, p_business_id, p_city, p_types
    )
    RETURNING workplaces.places.id INTO v_place_id;

    RETURN QUERY
    SELECT
        pl.id, pl.name, pl.note, pl.url, pl.tags, pl.wifi, pl.parking, pl.power_outlets, pl.quiet_level,
        pl.user_id, pl.latitude, pl.longitude, pl.district, pl.image_url, pl.address, pl.rating,
        pl.user_ratings_total,
        r.avg_rating::NUMERIC AS internal_rating,
        r.count_rating::INTEGER AS internal_review_count,
        pl.metadata, pl.approved, pl.business_id, pl.city, pl.types,
        pl.created_at, pl.updated_at
    FROM workplaces.places pl
    LEFT JOIN (
        SELECT place_id, AVG(overall) AS avg_rating, COUNT(*) AS count_rating
        FROM workplaces.place_ratings
        GROUP BY place_id
    ) r ON pl.id = r.place_id
    WHERE pl.id = v_place_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
