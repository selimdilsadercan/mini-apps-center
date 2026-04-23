-- Drop old function
DROP FUNCTION IF EXISTS public.itu_yemekhane_toggle_dislike(TEXT);

-- Function to toggle a dish in the dislike library
CREATE OR REPLACE FUNCTION itu_yemekhane.toggle_dislike(dish_name_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM itu_yemekhane.dislikes WHERE dish_name = dish_name_param) THEN
        DELETE FROM itu_yemekhane.dislikes WHERE dish_name = dish_name_param;
        RETURN 'removed';
    ELSE
        INSERT INTO itu_yemekhane.dislikes (dish_name) VALUES (dish_name_param);
        RETURN 'added';
    END IF;
END;
$$;
