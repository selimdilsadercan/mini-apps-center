DROP FUNCTION IF EXISTS workplaces.update_place(UUID, TEXT, TEXT, TEXT, TEXT[], BOOLEAN, BOOLEAN, BOOLEAN, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, INTEGER, JSONB);

CREATE OR REPLACE FUNCTION workplaces.update_place(
    p_id UUID,
    p_name TEXT,
    p_note TEXT DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT '{}',
    p_wifi BOOLEAN DEFAULT FALSE,
    p_parking BOOLEAN DEFAULT FALSE,
    p_power_outlets BOOLEAN DEFAULT FALSE,
    p_quiet_level INTEGER DEFAULT 3,
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
    UPDATE workplaces.places SET
        name = p_name,
        note = p_note,
        url = p_url,
        tags = p_tags,
        wifi = p_wifi,
        parking = p_parking,
        power_outlets = p_power_outlets,
        quiet_level = p_quiet_level,
        latitude = p_latitude,
        longitude = p_longitude,
        district = p_district,
        image_url = p_image_url,
        address = p_address,
        rating = p_rating,
        user_ratings_total = p_user_ratings_total,
        metadata = p_metadata,
        updated_at = NOW()
    WHERE id = p_id
    RETURNING *;
$$;
