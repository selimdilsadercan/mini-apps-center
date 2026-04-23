-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS recipe;

-- 2. Move table if exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recipes') THEN
        ALTER TABLE public.recipes SET SCHEMA recipe;
    END IF;
END $$;

-- 3. Create table if not exists (fresh install)
CREATE TABLE IF NOT EXISTS recipe.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  created_user_id UUID NOT NULL REFERENCES public.users(id),
  ingredients JSONB,
  instructions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Ensure indices
CREATE INDEX IF NOT EXISTS idx_recipes_created_user_id ON recipe.recipes(created_user_id);
