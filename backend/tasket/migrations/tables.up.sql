--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (clerk_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    -- Check if clerk_id is still TEXT in tasket.lists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'tasket' 
          AND table_name = 'lists' 
          AND column_name = 'clerk_id' 
          AND data_type = 'text'
    ) THEN
        -- 1. Rename old column in lists
        ALTER TABLE tasket.lists RENAME COLUMN clerk_id TO clerk_id_old;
        -- 2. Add new UUID column in lists
        ALTER TABLE tasket.lists ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        -- 3. Migrate data in lists
        UPDATE tasket.lists l
        SET user_id = u.id
        FROM public.users u
        WHERE l.clerk_id_old = u.clerk_id OR l.clerk_id_old = u.local_clerk_id;
        -- 4. Delete orphaned rows in lists
        DELETE FROM tasket.lists WHERE user_id IS NULL;
        -- 5. Set NOT NULL and drop old column in lists
        ALTER TABLE tasket.lists ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE tasket.lists DROP COLUMN clerk_id_old;
        -- 6. Re-create index in lists
        CREATE INDEX IF NOT EXISTS idx_tasket_lists_user_id ON tasket.lists(user_id);
    END IF;

    -- Check if clerk_id is still TEXT in tasket.items
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'tasket' 
          AND table_name = 'items' 
          AND column_name = 'clerk_id' 
          AND data_type = 'text'
    ) THEN
        -- 1. Rename old column in items
        ALTER TABLE tasket.items RENAME COLUMN clerk_id TO clerk_id_old;
        -- 2. Add new UUID column in items
        ALTER TABLE tasket.items ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        -- 3. Migrate data in items
        UPDATE tasket.items i
        SET user_id = u.id
        FROM public.users u
        WHERE i.clerk_id_old = u.clerk_id OR i.clerk_id_old = u.local_clerk_id;
        -- 4. Delete orphaned rows in items
        DELETE FROM tasket.items WHERE user_id IS NULL;
        -- 5. Set NOT NULL and drop old column in items
        ALTER TABLE tasket.items ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE tasket.items DROP COLUMN clerk_id_old;
        -- 6. Re-create index in items
        CREATE INDEX IF NOT EXISTS idx_tasket_items_user_id ON tasket.items(user_id);
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS tasket;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA tasket TO anon, authenticated, service_role;

-- 2. Lists (Pages) Table
CREATE TABLE IF NOT EXISTS tasket.lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content JSONB DEFAULT '{"type": "doc", "content": []}'::jsonb,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Items Table
CREATE TABLE IF NOT EXISTS tasket.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    list_id UUID REFERENCES tasket.lists(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    item_type TEXT NOT NULL DEFAULT 'task' CHECK (item_type IN ('note', 'task')),
    color TEXT,
    reminder_at TIMESTAMP WITH TIME ZONE,
    assignee TEXT,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_tasket_lists_user_id ON tasket.lists(user_id);
CREATE INDEX IF NOT EXISTS idx_tasket_items_user_id ON tasket.items(user_id);
CREATE INDEX IF NOT EXISTS idx_tasket_items_list_id ON tasket.items(list_id);
CREATE INDEX IF NOT EXISTS idx_tasket_items_due_date ON tasket.items(due_date);

-- 5. Grants
GRANT ALL ON ALL TABLES IN SCHEMA tasket TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tasket TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA tasket GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasket GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasket GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
