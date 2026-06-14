--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------

-- 1. Migration: user_id TEXT -> UUID Transition
DO $$ 
BEGIN 
    -- Check if user_id is still TEXT (or varchar) in subcenter.items
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'subcenter' 
          AND table_name = 'items' 
          AND column_name = 'user_id' 
          AND data_type IN ('text', 'character varying')
    ) THEN
        -- 1. Rename old column
        ALTER TABLE subcenter.items RENAME COLUMN user_id TO user_id_old;
        
        -- 2. Add new UUID column
        ALTER TABLE subcenter.items ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        -- 3. Migrate data
        UPDATE subcenter.items i
        SET user_id = u.id
        FROM public.users u
        WHERE i.user_id_old = u.clerk_id OR i.user_id_old = u.local_clerk_id;
        
        -- 4. Delete orphaned rows (where user couldn't be matched)
        DELETE FROM subcenter.items WHERE user_id IS NULL;
        
        -- 5. Set NOT NULL and drop old column
        ALTER TABLE subcenter.items ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE subcenter.items DROP COLUMN user_id_old;

        -- 6. Re-create index
        DROP INDEX IF EXISTS subcenter.idx_subcenter_items_user_id;
        CREATE INDEX IF NOT EXISTS idx_subcenter_items_user_id ON subcenter.items(user_id);
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS subcenter;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA subcenter TO anon, authenticated, service_role;

-- 2. Main Subscription Items
CREATE TABLE IF NOT EXISTS subcenter.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, 
  name TEXT NOT NULL,
  plan_name TEXT NOT NULL DEFAULT 'Standard',
  region TEXT NOT NULL DEFAULT 'TR',
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  cycle TEXT NOT NULL DEFAULT 'monthly',
  category TEXT NOT NULL DEFAULT 'other',
  color TEXT NOT NULL DEFAULT '#6366F1',
  icon TEXT NOT NULL DEFAULT '📦',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trial_duration TEXT DEFAULT NULL,
  website TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_subcenter_items_user_id ON subcenter.items(user_id);

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA subcenter TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA subcenter TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA subcenter GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA subcenter GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA subcenter GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
