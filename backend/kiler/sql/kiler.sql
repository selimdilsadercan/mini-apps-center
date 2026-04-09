-- Kiler tablosu ve temel yapısı
CREATE TABLE IF NOT EXISTS public.kiler_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX IF NOT EXISTS idx_kiler_clerk_id ON public.kiler_items(clerk_id);
