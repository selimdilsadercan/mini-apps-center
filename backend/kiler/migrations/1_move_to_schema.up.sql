-- 1. Create the new schema
CREATE SCHEMA IF NOT EXISTS kiler;

-- 2. Move the table to the new schema if it exists in public
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kiler_items') THEN
        ALTER TABLE public.kiler_items SET SCHEMA kiler;
        ALTER TABLE kiler.kiler_items RENAME TO items;
    END IF;
END $$;

-- 3. If the table didn't exist (fresh install), create it
CREATE TABLE IF NOT EXISTS kiler.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    storage_type TEXT NOT NULL CHECK (storage_type IN ('fridge', 'freezer', 'pantry')),
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ensure indices are correct
CREATE INDEX IF NOT EXISTS idx_kiler_items_clerk_id ON kiler.items(clerk_id);
