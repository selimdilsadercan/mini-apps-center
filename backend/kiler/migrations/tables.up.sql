--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (clerk_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'kiler' AND table_name = 'items' AND column_name = 'clerk_id') THEN
        -- Ensure user_id exists (it already does in current schema but let's be safe)
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'kiler' AND table_name = 'items' AND column_name = 'user_id') THEN
            ALTER TABLE kiler.items ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        -- Migrate data if user_id is null
        UPDATE kiler.items i
        SET user_id = u.id
        FROM public.users u
        WHERE i.user_id IS NULL AND (i.clerk_id = u.clerk_id OR i.clerk_id = u.local_clerk_id);

        -- Delete orphaned rows that couldn't be migrated (no matching user in public.users)
        DELETE FROM kiler.items WHERE user_id IS NULL;

        -- Drop old column
        ALTER TABLE kiler.items DROP COLUMN clerk_id;
        
        -- Make user_id NOT NULL
        ALTER TABLE kiler.items ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS kiler;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA kiler TO anon, authenticated, service_role;

-- 2. Items Table
CREATE TABLE IF NOT EXISTS kiler.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    storage_type TEXT NOT NULL CHECK (storage_type IN ('fridge', 'freezer', 'pantry')),
    purchase_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_kiler_items_user_id ON kiler.items(user_id);

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA kiler TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kiler TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kiler GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kiler GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kiler GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
