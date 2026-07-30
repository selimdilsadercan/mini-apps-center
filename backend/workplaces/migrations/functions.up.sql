-- Squashed functions for workplaces service

-- 1. Get Places
DROP FUNCTION IF EXISTS workplaces.get_places();
DROP FUNCTION IF EXISTS workplaces.get_places(TEXT);
CREATE OR REPLACE FUNCTION workplaces.get_places(p_city TEXT DEFAULT 'kahramanmaras')
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
    WHERE p.approved = TRUE
      AND p.city = p_city
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1.1 Get Business Places
DROP FUNCTION IF EXISTS workplaces.get_business_places(TEXT);
CREATE OR REPLACE FUNCTION workplaces.get_business_places(p_business_id TEXT)
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
    WHERE p.business_id = p_business_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Get Pending Places
DROP FUNCTION IF EXISTS workplaces.get_pending_places();
DROP FUNCTION IF EXISTS workplaces.get_pending_places(TEXT);
CREATE OR REPLACE FUNCTION workplaces.get_pending_places(p_city TEXT DEFAULT 'kahramanmaras')
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
        p.metadata, p.approved, p.city, p.types, p.created_at, p.updated_at
    FROM workplaces.places p
    LEFT JOIN (
        SELECT place_id, AVG(overall) as avg_rating, COUNT(*) as count_rating
        FROM workplaces.place_ratings
        GROUP BY place_id
    ) r ON p.id = r.place_id
    WHERE p.approved = FALSE
      AND p.city = p_city
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

-- 4. Add Place
DROP FUNCTION IF EXISTS workplaces.add_place(TEXT, TEXT, TEXT, TEXT[], BOOLEAN, BOOLEAN, BOOLEAN, INTEGER, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, INTEGER, JSONB, BOOLEAN, TEXT, TEXT, TEXT[]);
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
    RETURNING id INTO v_place_id;

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
    WHERE p.id = v_place_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update Place
DROP FUNCTION IF EXISTS workplaces.update_place(UUID, TEXT, TEXT, TEXT, TEXT[], BOOLEAN, BOOLEAN, BOOLEAN, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, NUMERIC, INTEGER, JSONB, TEXT, TEXT[]);
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
    p_metadata JSONB DEFAULT '{}',
    p_business_id TEXT DEFAULT NULL,
    p_types TEXT[] DEFAULT NULL
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
BEGIN
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
        business_id = COALESCE(p_business_id, workplaces.places.business_id),
        types = COALESCE(p_types, workplaces.places.types),
        updated_at = NOW()
    WHERE workplaces.places.id = p_id;

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
    WHERE p.id = p_id;
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
    internal_rating NUMERIC,
    internal_review_count INTEGER,
    metadata JSONB,
    approved BOOLEAN,
    types TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    UPDATE workplaces.places
    SET approved = TRUE, updated_at = NOW()
    WHERE workplaces.places.id = p_id;

    RETURN QUERY
    SELECT 
        p.id, p.name, p.note, p.url, p.tags, p.wifi, p.parking, p.power_outlets, p.quiet_level, 
        p.user_id, p.latitude, p.longitude, p.district, p.image_url, p.address, p.rating, 
        p.user_ratings_total,
        r.avg_rating::NUMERIC as internal_rating,
        r.count_rating::INTEGER as internal_review_count,
        p.metadata, p.approved, p.types,
        p.created_at, p.updated_at
    FROM workplaces.places p
    LEFT JOIN (
        SELECT place_id, AVG(overall) as avg_rating, COUNT(*) as count_rating
        FROM workplaces.place_ratings
        GROUP BY place_id
    ) r ON p.id = r.place_id
    WHERE p.id = p_id;
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
