-- Drop old function
DROP FUNCTION IF EXISTS public.itu_yemekhane_get_dislikes();

-- Function to get all disliked dishes
CREATE OR REPLACE FUNCTION itu_yemekhane.get_dislikes()
RETURNS TABLE(dish_name TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT d.dish_name 
    FROM itu_yemekhane.dislikes d 
    ORDER BY d.dish_name ASC;
END;
$$;
