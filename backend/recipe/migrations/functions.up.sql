-- FUNCTIONS
-- 1. recipe.get_user_recipes
-- 2. recipe.create
-- 3. recipe.get
-- 4. recipe.update
-- 5. recipe.delete

-- 1. Get User Recipes
DROP FUNCTION IF EXISTS recipe.get_user_recipes(TEXT);
DROP FUNCTION IF EXISTS recipe.get_user_recipes(UUID);
CREATE OR REPLACE FUNCTION recipe.get_user_recipes(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.title,
        r.image_url,
        r.created_at
    FROM recipe.recipes r
    WHERE r.created_user_id = v_user_id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Recipe
DROP FUNCTION IF EXISTS recipe.create(TEXT, TEXT, JSONB, JSONB);
DROP FUNCTION IF EXISTS recipe.create(TEXT, UUID, JSONB, JSONB);
CREATE OR REPLACE FUNCTION recipe.create(
    title_param TEXT,
    p_user_id TEXT,
    ingredients_param JSONB DEFAULT '[]'::jsonb,
    instructions_param JSONB DEFAULT '[]'::jsonb
)
RETURNS recipe.recipes AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result recipe.recipes;
BEGIN
    INSERT INTO recipe.recipes (
        title, 
        created_user_id, 
        ingredients, 
        instructions
    ) VALUES (
        title_param, 
        v_user_id, 
        ingredients_param, 
        instructions_param
    ) RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Recipe
DROP FUNCTION IF EXISTS recipe.get(UUID);
CREATE OR REPLACE FUNCTION recipe.get(recipe_id_param UUID)
RETURNS SETOF recipe.recipes AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM recipe.recipes
    WHERE id = recipe_id_param
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Recipe
DROP FUNCTION IF EXISTS recipe.update(UUID, TEXT, TEXT, JSONB, JSONB);
DROP FUNCTION IF EXISTS recipe.update(UUID, UUID, TEXT, JSONB, JSONB);
CREATE OR REPLACE FUNCTION recipe.update(
    recipe_id_param UUID,
    p_user_id TEXT,
    title_param TEXT,
    ingredients_param JSONB,
    instructions_param JSONB
)
RETURNS recipe.recipes AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result recipe.recipes;
BEGIN
    UPDATE recipe.recipes
    SET 
        title = title_param,
        ingredients = ingredients_param,
        instructions = instructions_param
    WHERE id = recipe_id_param
      AND created_user_id = v_user_id
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Delete Recipe
DROP FUNCTION IF EXISTS recipe.delete(UUID, TEXT);
DROP FUNCTION IF EXISTS recipe.delete(UUID, UUID);
CREATE OR REPLACE FUNCTION recipe.delete(
    recipe_id_param UUID,
    p_user_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    deleted_count INTEGER;
BEGIN
    DELETE FROM recipe.recipes
    WHERE id = recipe_id_param
      AND created_user_id = v_user_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
