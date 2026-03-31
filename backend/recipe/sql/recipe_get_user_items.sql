DROP FUNCTION IF EXISTS recipe_get_user_items;

CREATE FUNCTION recipe_get_user_items(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    title,
    image_url,
    created_at
  FROM recipes
  WHERE created_user_id = user_id_param
  ORDER BY created_at DESC;
$$;
