-- FUNCTIONS
-- 1. movies_this_year.get_favorites
-- 2. movies_this_year.toggle_favorite

-- 1. Get Favorites
DROP FUNCTION IF EXISTS movies_this_year.get_favorites(TEXT);
CREATE OR REPLACE FUNCTION movies_this_year.get_favorites(clerk_id_param TEXT)
RETURNS TABLE(movie_id INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY 
    SELECT f.movie_id 
    FROM movies_this_year.favorites f 
    WHERE f.user_id = v_user_id;
END;
$$;

-- 2. Toggle Favorite
DROP FUNCTION IF EXISTS movies_this_year.toggle_favorite(TEXT, INTEGER);
CREATE OR REPLACE FUNCTION movies_this_year.toggle_favorite(clerk_id_param TEXT, movie_id_param INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM movies_this_year.favorites 
        WHERE user_id = v_user_id AND movie_id = movie_id_param
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM movies_this_year.favorites 
        WHERE user_id = v_user_id AND movie_id = movie_id_param;
        RETURN FALSE;
    ELSE
        INSERT INTO movies_this_year.favorites (user_id, movie_id) 
        VALUES (v_user_id, movie_id_param);
        RETURN TRUE;
    END IF;
END;
$$;
