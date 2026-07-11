-- FUNCTIONS
-- 1. recipe.get_user_recipes
-- 2. recipe.create
-- 3. recipe.get
-- 4. recipe.update
-- 5. recipe.delete
-- 6. recipe.get_plan
-- 7. recipe.set_plan

-- 1. Get User Recipes
DROP FUNCTION IF EXISTS recipe.get_user_recipes(TEXT);
DROP FUNCTION IF EXISTS recipe.get_user_recipes(UUID);
CREATE OR REPLACE FUNCTION recipe.get_user_recipes(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    image_url TEXT,
    category TEXT,
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
        r.category,
        r.created_at
    FROM recipe.recipes r
    WHERE r.created_user_id = v_user_id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Recipe
DROP FUNCTION IF EXISTS recipe.create(TEXT, TEXT, JSONB, JSONB);
DROP FUNCTION IF EXISTS recipe.create(TEXT, UUID, JSONB, JSONB);
DROP FUNCTION IF EXISTS recipe.create(TEXT, TEXT, JSONB, JSONB, TEXT);
CREATE OR REPLACE FUNCTION recipe.create(
    title_param TEXT,
    p_user_id TEXT,
    ingredients_param JSONB DEFAULT '[]'::jsonb,
    instructions_param JSONB DEFAULT '[]'::jsonb,
    category_param TEXT DEFAULT NULL
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
        instructions,
        category
    ) VALUES (
        title_param, 
        v_user_id, 
        ingredients_param, 
        instructions_param,
        category_param
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
DROP FUNCTION IF EXISTS recipe.update(UUID, TEXT, TEXT, JSONB, JSONB, TEXT);
CREATE OR REPLACE FUNCTION recipe.update(
    recipe_id_param UUID,
    p_user_id TEXT,
    title_param TEXT,
    ingredients_param JSONB,
    instructions_param JSONB,
    category_param TEXT DEFAULT NULL
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
        instructions = instructions_param,
        category = category_param
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

-- 6. Get Meal Plan
DROP FUNCTION IF EXISTS recipe.get_plan(TEXT);
DROP FUNCTION IF EXISTS recipe.get_plan(UUID);
CREATE OR REPLACE FUNCTION recipe.get_plan(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    day_key TEXT,
    title TEXT,
    meal_type TEXT,
    recipe_id UUID,
    sort_order INTEGER
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        to_char(e.day_date, 'YYYY-MM-DD') AS day_key,
        e.title,
        e.meal_type,
        e.recipe_id,
        e.sort_order
    FROM recipe.meal_plan_entries e
    WHERE e.created_user_id = v_user_id
    ORDER BY e.day_date ASC, e.sort_order ASC, e.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Replace Meal Plan
DROP FUNCTION IF EXISTS recipe.set_plan(TEXT, JSONB);
DROP FUNCTION IF EXISTS recipe.set_plan(UUID, JSONB);
CREATE OR REPLACE FUNCTION recipe.set_plan(
    p_user_id TEXT,
    plan_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_day_key TEXT;
    v_day_meals JSONB;
    v_meal JSONB;
    v_sort_order INTEGER;
    v_meal_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for meal plan save';
    END IF;

    DELETE FROM recipe.meal_plan_entries
    WHERE created_user_id = v_user_id;

    IF plan_data IS NULL OR jsonb_typeof(plan_data) <> 'object' THEN
        RETURN TRUE;
    END IF;

    FOR v_day_key, v_day_meals IN
        SELECT key, value
        FROM jsonb_each(plan_data)
    LOOP
        IF jsonb_typeof(v_day_meals) <> 'array' THEN
            CONTINUE;
        END IF;

        FOR v_meal, v_sort_order IN
            SELECT value, ordinality::INTEGER - 1
            FROM jsonb_array_elements(v_day_meals) WITH ORDINALITY
        LOOP
            v_meal_id := CASE
                WHEN COALESCE(v_meal->>'id', '') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                THEN (v_meal->>'id')::UUID
                ELSE gen_random_uuid()
            END;

            INSERT INTO recipe.meal_plan_entries (
                id,
                created_user_id,
                day_date,
                title,
                meal_type,
                recipe_id,
                sort_order
            ) VALUES (
                v_meal_id,
                v_user_id,
                v_day_key::DATE,
                COALESCE(NULLIF(TRIM(v_meal->>'title'), ''), 'Adsiz Ogun'),
                CASE
                    WHEN v_meal->>'mealType' IN ('breakfast', 'lunch', 'dinner') THEN v_meal->>'mealType'
                    ELSE 'dinner'
                END,
                NULLIF(v_meal->>'recipeId', '')::UUID,
                v_sort_order
            );
        END LOOP;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
