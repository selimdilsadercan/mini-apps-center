--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------
ALTER TABLE contributions.contributions ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS contributions;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA contributions TO anon, authenticated, service_role;

-- 2. Contributions Table
CREATE TABLE IF NOT EXISTS contributions.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- 'recipe', 'card_game' vb.
    title TEXT NOT NULL,
    image_url TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Esnek payload
    approved BOOLEAN NOT NULL DEFAULT FALSE, -- Admin onay sütunu
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_contributions_created_user_id ON contributions.contributions(created_user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_type ON contributions.contributions(content_type);

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA contributions TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA contributions TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA contributions GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA contributions GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA contributions GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 5. Copy existing recipes to contributions
INSERT INTO contributions.contributions (
    id,
    created_user_id,
    content_type,
    title,
    image_url,
    data,
    approved,
    created_at
)
SELECT 
    r.id,
    r.created_user_id,
    'recipe',
    r.title,
    r.image_url,
    jsonb_build_object(
        'ingredients', r.ingredients,
        'instructions', r.instructions,
        'category', r.category
    ),
    TRUE, -- Geçmiş tarifler otomatik onaylı başlar
    r.created_at
FROM recipe.recipes r
ON CONFLICT (id) DO NOTHING;

