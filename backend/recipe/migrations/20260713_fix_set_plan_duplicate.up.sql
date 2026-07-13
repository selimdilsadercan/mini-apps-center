-- Fix duplicate key errors when meal plan saves overlap (concurrent PUT requests)
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
            )
            ON CONFLICT (id) DO UPDATE SET
                created_user_id = EXCLUDED.created_user_id,
                day_date = EXCLUDED.day_date,
                title = EXCLUDED.title,
                meal_type = EXCLUDED.meal_type,
                recipe_id = EXCLUDED.recipe_id,
                sort_order = EXCLUDED.sort_order;
        END LOOP;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
