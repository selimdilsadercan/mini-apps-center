--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS eksik_var;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA eksik_var TO anon, authenticated, service_role;

-- 2. Missing Items Table
CREATE TABLE IF NOT EXISTS eksik_var.missing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_eksik_var_missing_items_user_id ON eksik_var.missing_items(user_id);

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA eksik_var TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA eksik_var TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA eksik_var GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA eksik_var GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA eksik_var GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
