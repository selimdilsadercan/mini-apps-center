-- Recipe Schema
CREATE SCHEMA IF NOT EXISTS recipe;

-- Recipe: Table creation
CREATE TABLE IF NOT EXISTS recipe.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  created_user_id UUID NOT NULL REFERENCES public.users(id),
  ingredients JSONB,
  instructions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_created_user_id ON recipe.recipes(created_user_id);
