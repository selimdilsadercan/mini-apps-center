-- Drop old function
DROP FUNCTION IF EXISTS public.recipe_delete_item(UUID, UUID);

-- Create new function
CREATE OR REPLACE FUNCTION recipe.delete(
  recipe_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM recipe.recipes
  WHERE id = recipe_id_param
    AND created_user_id = user_id_param;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$;
