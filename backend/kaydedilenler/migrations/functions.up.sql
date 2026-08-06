-- FUNCTIONS
-- 1. kaydedilenler.get_user_bookmarks
-- 2. kaydedilenler.create_bookmark
-- 3. kaydedilenler.update_bookmark
-- 4. kaydedilenler.delete_bookmark

-- 1. Get User Bookmarks
DROP FUNCTION IF EXISTS kaydedilenler.get_user_bookmarks(TEXT);
CREATE OR REPLACE FUNCTION kaydedilenler.get_user_bookmarks(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    url TEXT,
    image_url TEXT,
    category TEXT,
    instagram_username TEXT,
    city TEXT,
    district TEXT,
    rating NUMERIC,
    is_visited BOOLEAN,
    is_favorite BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.description,
        b.url,
        b.image_url,
        b.category,
        b.instagram_username,
        b.city,
        b.district,
        b.rating,
        b.is_visited,
        b.is_favorite,
        b.created_at
    FROM kaydedilenler.bookmarks b
    WHERE b.created_user_id = v_user_id
    ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Bookmark
DROP FUNCTION IF EXISTS kaydedilenler.create_bookmark(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, BOOLEAN, BOOLEAN);
CREATE OR REPLACE FUNCTION kaydedilenler.create_bookmark(
    p_user_id TEXT,
    p_title TEXT,
    p_description TEXT,
    p_url TEXT,
    p_image_url TEXT,
    p_category TEXT,
    p_instagram_username TEXT,
    p_city TEXT,
    p_district TEXT,
    p_rating NUMERIC,
    p_is_visited BOOLEAN,
    p_is_favorite BOOLEAN
)
RETURNS kaydedilenler.bookmarks AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result kaydedilenler.bookmarks;
BEGIN
    INSERT INTO kaydedilenler.bookmarks (
        created_user_id,
        title,
        description,
        url,
        image_url,
        category,
        instagram_username,
        city,
        district,
        rating,
        is_visited,
        is_favorite
    ) VALUES (
        v_user_id,
        p_title,
        p_description,
        p_url,
        p_image_url,
        p_category,
        p_instagram_username,
        p_city,
        p_district,
        p_rating,
        COALESCE(p_is_visited, FALSE),
        COALESCE(p_is_favorite, FALSE)
    ) RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Bookmark
DROP FUNCTION IF EXISTS kaydedilenler.update_bookmark(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, BOOLEAN, BOOLEAN);
CREATE OR REPLACE FUNCTION kaydedilenler.update_bookmark(
    p_bookmark_id UUID,
    p_user_id TEXT,
    p_title TEXT,
    p_description TEXT,
    p_url TEXT,
    p_image_url TEXT,
    p_category TEXT,
    p_instagram_username TEXT,
    p_city TEXT,
    p_district TEXT,
    p_rating NUMERIC,
    p_is_visited BOOLEAN,
    p_is_favorite BOOLEAN
)
RETURNS kaydedilenler.bookmarks AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result kaydedilenler.bookmarks;
BEGIN
    UPDATE kaydedilenler.bookmarks
    SET
        title = p_title,
        description = p_description,
        url = p_url,
        image_url = p_image_url,
        category = p_category,
        instagram_username = p_instagram_username,
        city = p_city,
        district = p_district,
        rating = p_rating,
        is_visited = p_is_visited,
        is_favorite = p_is_favorite
    WHERE id = p_bookmark_id
      AND created_user_id = v_user_id
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Delete Bookmark
DROP FUNCTION IF EXISTS kaydedilenler.delete_bookmark(UUID, TEXT);
CREATE OR REPLACE FUNCTION kaydedilenler.delete_bookmark(
    p_bookmark_id UUID,
    p_user_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    deleted_count INTEGER;
BEGIN
    DELETE FROM kaydedilenler.bookmarks
    WHERE id = p_bookmark_id
      AND created_user_id = v_user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
