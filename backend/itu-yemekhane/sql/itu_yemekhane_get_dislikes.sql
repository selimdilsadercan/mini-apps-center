-- Function to get all disliked dishes for global list display
CREATE OR REPLACE FUNCTION itu_yemekhane_get_dislikes()
RETURNS TABLE(dish_name TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT d.dish_name 
    FROM itu_yemekhane_dislikes d 
    ORDER BY d.dish_name ASC;
END;
$$;
