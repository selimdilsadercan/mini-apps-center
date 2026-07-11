--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- Ensure meal_type exists on older meal_plan_entries tables.
ALTER TABLE recipe.meal_plan_entries
    ADD COLUMN IF NOT EXISTS meal_type TEXT NOT NULL DEFAULT 'dinner';

-- Add category column to recipes table
ALTER TABLE recipe.recipes
    ADD COLUMN IF NOT EXISTS category TEXT;

-- Migrate old custom meal plan entries to mock recipes
DO $$
DECLARE
    r RECORD;
    v_recipe_id UUID;
    v_category TEXT;
BEGIN
    -- Check if we have any custom meals to migrate
    IF EXISTS (SELECT 1 FROM recipe.meal_plan_entries WHERE recipe_id IS NULL) THEN
        FOR r IN 
            SELECT id, created_user_id, title, meal_type 
            FROM recipe.meal_plan_entries 
            WHERE recipe_id IS NULL
        LOOP
            -- Map old meal_type to category
            v_category := CASE
                WHEN r.meal_type = 'breakfast' THEN 'Kahvaltı'
                ELSE 'Ana Yemek'
            END;

            -- Insert new recipe
            INSERT INTO recipe.recipes (
                title, 
                created_user_id, 
                ingredients, 
                instructions,
                category
            ) VALUES (
                r.title, 
                r.created_user_id, 
                '[]'::jsonb, 
                '[]'::jsonb,
                v_category
            ) RETURNING id INTO v_recipe_id;

            -- Update meal plan entry to reference the new recipe
            UPDATE recipe.meal_plan_entries
            SET recipe_id = v_recipe_id
            WHERE id = r.id;
        END LOOP;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS recipe;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA recipe TO anon, authenticated, service_role;

-- 2. Recipes Table
CREATE TABLE IF NOT EXISTS recipe.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT,
    category TEXT,
    created_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ingredients JSONB DEFAULT '[]'::jsonb NOT NULL,
    instructions JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Meal Plan Entries Table
CREATE TABLE IF NOT EXISTS recipe.meal_plan_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    day_date DATE NOT NULL,
    title TEXT NOT NULL,
    meal_type TEXT NOT NULL DEFAULT 'dinner',
    recipe_id UUID REFERENCES recipe.recipes(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_created_user_id ON recipe.recipes(created_user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_entries_user_day ON recipe.meal_plan_entries(created_user_id, day_date);

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA recipe TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA recipe TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA recipe GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA recipe GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA recipe GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
