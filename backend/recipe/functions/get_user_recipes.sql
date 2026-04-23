-- Drop old function
DROP FUNCTION IF EXISTS public.recipe_get_user_items(UUID);

-- Create new function
CREATE OR REPLACE FUNCTION recipe.get_user_recipes(user_id_param UUID)
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
  FROM recipe.recipes
  WHERE created_user_id = user_id_param
  ORDER BY created_at DESC;
$$;
