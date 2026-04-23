-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS subcenter;

-- 2. Move subcenter_items
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subcenter_items') THEN
        ALTER TABLE public.subcenter_items SET SCHEMA subcenter;
        ALTER TABLE subcenter.subcenter_items RENAME TO items;
    END IF;
END $$;

-- 3. Move subcenter_global_presets
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subcenter_global_presets') THEN
        ALTER TABLE public.subcenter_global_presets SET SCHEMA subcenter;
        ALTER TABLE subcenter.subcenter_global_presets RENAME TO global_presets;
    END IF;
END $$;

-- 4. Create tables if not exists (fresh install)
CREATE TABLE IF NOT EXISTS subcenter.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, 
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subcenter.global_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_name TEXT NOT NULL DEFAULT 'Standard',
  region TEXT NOT NULL DEFAULT 'TR',
  avg_price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  category TEXT NOT NULL DEFAULT 'other',
  color TEXT NOT NULL DEFAULT '#6366F1',
  icon TEXT NOT NULL DEFAULT '📦',
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, plan_name, region)
);

-- 5. Ensure indices
CREATE INDEX IF NOT EXISTS idx_subcenter_items_user_id ON subcenter.items(user_id);
CREATE INDEX IF NOT EXISTS idx_subcenter_global_presets_lookup ON subcenter.global_presets(name, region);
