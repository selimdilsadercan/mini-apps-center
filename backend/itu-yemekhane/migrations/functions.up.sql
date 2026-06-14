-- FUNCTIONS
-- 1. itu_yemekhane.get_dislikes
-- 2. itu_yemekhane.toggle_dislike

-- 1. Get Dislikes
DROP FUNCTION IF EXISTS itu_yemekhane.get_dislikes();
DROP FUNCTION IF EXISTS itu_yemekhane.get_dislikes(TEXT);
CREATE OR REPLACE FUNCTION itu_yemekhane.get_dislikes(clerk_id_param TEXT)
RETURNS TABLE(dish_name TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY 
    SELECT d.dish_name 
    FROM itu_yemekhane.dislikes d 
    WHERE d.user_id = v_user_id
    ORDER BY d.dish_name ASC;
END;
$$;

-- 2. Toggle Dislike
DROP FUNCTION IF EXISTS itu_yemekhane.toggle_dislike(TEXT);
DROP FUNCTION IF EXISTS itu_yemekhane.toggle_dislike(TEXT, TEXT);
CREATE OR REPLACE FUNCTION itu_yemekhane.toggle_dislike(clerk_id_param TEXT, dish_name_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF EXISTS (SELECT 1 FROM itu_yemekhane.dislikes WHERE user_id = v_user_id AND dish_name = dish_name_param) THEN
        DELETE FROM itu_yemekhane.dislikes WHERE user_id = v_user_id AND dish_name = dish_name_param;
        RETURN 'removed';
    ELSE
        INSERT INTO itu_yemekhane.dislikes (user_id, dish_name) VALUES (v_user_id, dish_name_param);
        RETURN 'added';
    END IF;
END;
$$;
