--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (Global -> User-specific with UUID)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'itu_yemekhane' AND table_name = 'dislikes') THEN
        -- Check if user_id column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'itu_yemekhane' AND table_name = 'dislikes' AND column_name = 'user_id') THEN
            -- Add user_id column (nullable initially to handle existing data if any, but we'll probably just clear it or it's empty)
            ALTER TABLE itu_yemekhane.dislikes ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
            
            -- Remove unique constraint on dish_name
            ALTER TABLE itu_yemekhane.dislikes DROP CONSTRAINT IF EXISTS dislikes_dish_name_key;
            
            -- Since it was global, we don't know who disliked what. 
            -- We'll just clear the table to start fresh with user-specific dislikes.
            DELETE FROM itu_yemekhane.dislikes;
            
            -- Now make user_id NOT NULL
            ALTER TABLE itu_yemekhane.dislikes ALTER COLUMN user_id SET NOT NULL;
            
            -- Add new unique constraint
            ALTER TABLE itu_yemekhane.dislikes ADD CONSTRAINT dislikes_user_id_dish_name_key UNIQUE (user_id, dish_name);
        END IF;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS itu_yemekhane;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA itu_yemekhane TO anon, authenticated, service_role;

-- 2. Dislikes Table
CREATE TABLE IF NOT EXISTS itu_yemekhane.dislikes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dish_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, dish_name)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_itu_yemekhane_dislikes_user_id ON itu_yemekhane.dislikes(user_id);

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA itu_yemekhane TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA itu_yemekhane TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA itu_yemekhane GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA itu_yemekhane GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA itu_yemekhane GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
