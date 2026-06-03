-- 1. Schema Changes
ALTER TABLE workplaces.places ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;

-- Mark existing places as approved
UPDATE workplaces.places SET approved = TRUE WHERE approved IS NULL OR approved = FALSE;

-- Set default for future inserts
ALTER TABLE workplaces.places ALTER COLUMN approved SET DEFAULT FALSE;

-- 2. Functions Updates / Additions

-- Update get_places
DROP FUNCTION IF EXISTS workplaces.get_places();
CREATE OR REPLACE FUNCTION workplaces.get_places()
RETURNS SETOF workplaces.places
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM workplaces.places WHERE approved = TRUE ORDER BY created_at DESC;
$$;

-- Create get_pending_places
DROP FUNCTION IF EXISTS workplaces.get_pending_places();
CREATE OR REPLACE FUNCTION workplaces.get_pending_places()
RETURNS SETOF workplaces.places
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM workplaces.places WHERE approved = FALSE ORDER BY created_at DESC;
$$;

-- Create approve_place
DROP FUNCTION IF EXISTS workplaces.approve_place(UUID);
CREATE OR REPLACE FUNCTION workplaces.approve_place(p_id UUID)
RETURNS SETOF workplaces.places
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE workplaces.places
    SET approved = TRUE, updated_at = NOW()
    WHERE id = p_id
    RETURNING *;
$$;

-- Create delete_place
DROP FUNCTION IF EXISTS workplaces.delete_place(UUID);
CREATE OR REPLACE FUNCTION workplaces.delete_place(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM workplaces.places WHERE id = p_id;
    RETURN FOUND;
END;
$$;

-- Create update_place
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

-- Update add_place
DROP FUNCTION IF EXISTS workplaces.add_place(text, text, text, text[], boolean, boolean, boolean, integer, text, numeric, numeric, text, text, text, numeric, integer, jsonb);
DROP FUNCTION IF EXISTS workplaces.add_place(text, text, text, text[], boolean, boolean, boolean, integer, text, numeric, numeric, text, text, text, numeric, integer, jsonb, boolean);
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
    p_metadata JSONB DEFAULT '{}',
    p_approved BOOLEAN DEFAULT FALSE
)
RETURNS SETOF workplaces.places
LANGUAGE sql
SECURITY DEFINER
AS $$
    INSERT INTO workplaces.places (
        name, note, url, tags, wifi, parking, power_outlets, quiet_level, suggested_by,
        latitude, longitude, district, image_url, address, rating, user_ratings_total, metadata, approved
    ) VALUES (
        p_name, p_note, p_url, p_tags, p_wifi, p_parking, p_power_outlets, p_quiet_level, p_suggested_by,
        p_latitude, p_longitude, p_district, p_image_url, p_address, p_rating, p_user_ratings_total, p_metadata, p_approved
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
        approved = EXCLUDED.approved,
        updated_at = NOW()
    RETURNING *;
$$;
