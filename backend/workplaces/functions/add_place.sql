DROP FUNCTION IF EXISTS workplaces.add_place(text, text, text, text[], boolean, boolean, boolean, integer, text, numeric, numeric, text, text, text, numeric, integer, jsonb);

CREATE OR REPLACE FUNCTION workplaces.add_place(
    p_name TEXT,
    p_note TEXT DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT '{}',
    p_wifi BOOLEAN DEFAULT FALSE,
    p_parking BOOLEAN DEFAULT FALSE,
    p_power_outlets BOOLEAN DEFAULT FALSE,
    p_quiet_level INTEGER DEFAULT 3,
    p_suggested_by TEXT DEFAULT NULL,
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_rating NUMERIC DEFAULT NULL,
    p_user_ratings_total INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS SETOF workplaces.places
LANGUAGE sql
SECURITY DEFINER
AS $$
    INSERT INTO workplaces.places (
        name, note, url, tags, wifi, parking, power_outlets, quiet_level, suggested_by,
        latitude, longitude, district, image_url, address, rating, user_ratings_total, metadata
    ) VALUES (
        p_name, p_note, p_url, p_tags, p_wifi, p_parking, p_power_outlets, p_quiet_level, p_suggested_by,
        p_latitude, p_longitude, p_district, p_image_url, p_address, p_rating, p_user_ratings_total, p_metadata
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        note = COALESCE(EXCLUDED.note, workplaces.places.note),
        url = COALESCE(EXCLUDED.url, workplaces.places.url),
        tags = EXCLUDED.tags,
        wifi = EXCLUDED.wifi,
        parking = EXCLUDED.parking,
        power_outlets = EXCLUDED.power_outlets,
        quiet_level = EXCLUDED.quiet_level,
        latitude = COALESCE(EXCLUDED.latitude, workplaces.places.latitude),
        longitude = COALESCE(EXCLUDED.longitude, workplaces.places.longitude),
        district = COALESCE(EXCLUDED.district, workplaces.places.district),
        image_url = COALESCE(EXCLUDED.image_url, workplaces.places.image_url),
        address = COALESCE(EXCLUDED.address, workplaces.places.address),
        rating = COALESCE(EXCLUDED.rating, workplaces.places.rating),
        user_ratings_total = COALESCE(EXCLUDED.user_ratings_total, workplaces.places.user_ratings_total),
        metadata = workplaces.places.metadata || EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING *;
$$;
