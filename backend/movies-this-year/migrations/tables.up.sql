--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- No legacy data to migrate for this service.

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS movies_this_year;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA movies_this_year TO anon, authenticated, service_role;

-- 2. Favorites Table
CREATE TABLE IF NOT EXISTS movies_this_year.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, movie_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_movies_this_year_favorites_user_id ON movies_this_year.favorites(user_id);

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA movies_this_year TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA movies_this_year TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA movies_this_year GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA movies_this_year GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA movies_this_year GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
