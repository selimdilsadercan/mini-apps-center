-- Kiler Schema
CREATE SCHEMA IF NOT EXISTS kiler;

-- Kiler tablosu ve temel yapısı
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

-- Indexler
CREATE INDEX IF NOT EXISTS idx_kiler_items_clerk_id ON kiler.items(clerk_id);
