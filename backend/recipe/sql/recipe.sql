-- Recipe: Table creation
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  created_user_id UUID NOT NULL REFERENCES users(id),
  ingredients JSONB,
  instructions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_created_user_id ON recipes(created_user_id);
