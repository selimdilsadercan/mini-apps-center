-- Drop old function
DROP FUNCTION IF EXISTS public.recipe_get_item(UUID);

-- Create new function
CREATE OR REPLACE FUNCTION recipe.get(recipe_id_param UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  created_user_id UUID,
  ingredients JSONB,
  instructions JSONB
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    title,
    image_url,
    created_at,
    created_user_id,
    ingredients,
    instructions
  FROM recipe.recipes
  WHERE id = recipe_id_param
  LIMIT 1;
$$;
