-- Drop old function
DROP FUNCTION IF EXISTS public.recipe_create_item(TEXT, UUID, JSONB, JSONB);

-- Create new function
CREATE OR REPLACE FUNCTION recipe.create(
  title_param TEXT,
  user_id_param UUID,
  ingredients_param JSONB DEFAULT NULL,
  instructions_param JSONB DEFAULT NULL
)
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
VOLATILE
AS $$
  INSERT INTO recipe.recipes (title, created_user_id, ingredients, instructions)
  VALUES (title_param, user_id_param, ingredients_param, instructions_param)
  RETURNING id, title, image_url, created_at, created_user_id, ingredients, instructions;
$$;
