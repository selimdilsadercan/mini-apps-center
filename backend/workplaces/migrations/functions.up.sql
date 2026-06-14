-- Squashed functions for workplaces service

-- 1. Get Places
DROP FUNCTION IF EXISTS workplaces.get_places();
CREATE OR REPLACE FUNCTION workplaces.get_places()
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
    metadata JSONB,
    approved BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.note, p.url, p.tags, p.wifi, p.parking, p.power_outlets, p.quiet_level, 
        p.user_id, p.latitude, p.longitude, p.district, p.image_url, p.address, p.rating, 
        p.user_ratings_total, p.metadata, p.approved, p.created_at, p.updated_at
    FROM workplaces.places p
    WHERE p.approved = TRUE
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Get Pending Places
DROP FUNCTION IF EXISTS workplaces.get_pending_places();
CREATE OR REPLACE FUNCTION workplaces.get_pending_places()
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
    metadata JSONB,
    approved BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.note, p.url, p.tags, p.wifi, p.parking, p.power_outlets, p.quiet_level, 
        p.user_id, p.latitude, p.longitude, p.district, p.image_url, p.address, p.rating, 
        p.user_ratings_total, p.metadata, p.approved, p.created_at, p.updated_at
    FROM workplaces.places p
    WHERE p.approved = FALSE
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Get Place
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
    metadata JSONB,
    approved BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.note, p.url, p.tags, p.wifi, p.parking, p.power_outlets, p.quiet_level, 
        p.user_id, p.latitude, p.longitude, p.district, p.image_url, p.address, p.rating, 
        p.user_ratings_total, p.metadata, p.approved, p.created_at, p.updated_at
    FROM workplaces.places p
    WHERE p.id = p_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Add Place
DROP FUNCTION IF EXISTS workplaces.add_place(TEXT, TEXT, TEXT, TEXT[], BOOLEAN, BOOLEAN, BOOLEAN, INTEGER, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, INTEGER, JSONB, BOOLEAN);
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
    p_approved BOOLEAN DEFAULT FALSE
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
    metadata JSONB,
    approved BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    INSERT INTO workplaces.places (
        name, note, url, tags, wifi, parking, power_outlets, quiet_level, user_id,
        latitude, longitude, district, image_url, address, rating, user_ratings_total, metadata, approved
    ) VALUES (
        p_name, p_note, p_url, p_tags, p_wifi, p_parking, p_power_outlets, p_quiet_level, v_user_id,
        p_latitude, p_longitude, p_district, p_image_url, p_address, p_rating, p_user_ratings_total, p_metadata, p_approved
    )
    RETURNING 
        workplaces.places.id, workplaces.places.name, workplaces.places.note, workplaces.places.url, 
        workplaces.places.tags, workplaces.places.wifi, workplaces.places.parking, 
        workplaces.places.power_outlets, workplaces.places.quiet_level, workplaces.places.user_id, 
        workplaces.places.latitude, workplaces.places.longitude, workplaces.places.district, 
        workplaces.places.image_url, workplaces.places.address, workplaces.places.rating, 
        workplaces.places.user_ratings_total, workplaces.places.metadata, workplaces.places.approved, 
        workplaces.places.created_at, workplaces.places.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update Place
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
    metadata JSONB,
    approved BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
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
    WHERE workplaces.places.id = p_id
    RETURNING 
        workplaces.places.id, workplaces.places.name, workplaces.places.note, workplaces.places.url, 
        workplaces.places.tags, workplaces.places.wifi, workplaces.places.parking, 
        workplaces.places.power_outlets, workplaces.places.quiet_level, workplaces.places.user_id, 
        workplaces.places.latitude, workplaces.places.longitude, workplaces.places.district, 
        workplaces.places.image_url, workplaces.places.address, workplaces.places.rating, 
        workplaces.places.user_ratings_total, workplaces.places.metadata, workplaces.places.approved, 
        workplaces.places.created_at, workplaces.places.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Approve Place
DROP FUNCTION IF EXISTS workplaces.approve_place(UUID);
CREATE OR REPLACE FUNCTION workplaces.approve_place(p_id UUID)
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
    metadata JSONB,
    approved BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    UPDATE workplaces.places
    SET approved = TRUE, updated_at = NOW()
    WHERE workplaces.places.id = p_id
    RETURNING 
        workplaces.places.id, workplaces.places.name, workplaces.places.note, workplaces.places.url, 
        workplaces.places.tags, workplaces.places.wifi, workplaces.places.parking, 
        workplaces.places.power_outlets, workplaces.places.quiet_level, workplaces.places.user_id, 
        workplaces.places.latitude, workplaces.places.longitude, workplaces.places.district, 
        workplaces.places.image_url, workplaces.places.address, workplaces.places.rating, 
        workplaces.places.user_ratings_total, workplaces.places.metadata, workplaces.places.approved, 
        workplaces.places.created_at, workplaces.places.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Delete Place
DROP FUNCTION IF EXISTS workplaces.delete_place(UUID);
CREATE OR REPLACE FUNCTION workplaces.delete_place(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM workplaces.places WHERE id = p_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Toggle Favorite
DROP FUNCTION IF EXISTS workplaces.toggle_favorite(UUID, TEXT);
CREATE OR REPLACE FUNCTION workplaces.toggle_favorite(
    p_place_id UUID,
    p_user_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    exists_val BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for p_user_id %', p_user_id;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM workplaces.favorites
        WHERE place_id = p_place_id AND user_id = v_user_id
    ) INTO exists_val;

    IF exists_val THEN
        DELETE FROM workplaces.favorites
        WHERE place_id = p_place_id AND user_id = v_user_id;
        RETURN FALSE;
    ELSE
        INSERT INTO workplaces.favorites (place_id, user_id)
        VALUES (p_place_id, v_user_id);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Get Favorite Place IDs
DROP FUNCTION IF EXISTS workplaces.get_favorite_place_ids(TEXT);
CREATE OR REPLACE FUNCTION workplaces.get_favorite_place_ids(p_user_id TEXT)
RETURNS SETOF UUID AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT f.place_id
    FROM workplaces.favorites f
    WHERE f.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA workplaces TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA workplaces GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
