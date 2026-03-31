-- ==========================================
-- SUB-CENTER: MAIN TABLE DEFINITIONS (v2: Multi-Plan Support)
-- ==========================================

-- 1. Main Subscription Items
CREATE TABLE IF NOT EXISTS subcenter_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, 
  name TEXT NOT NULL,
  plan_name TEXT NOT NULL DEFAULT 'Standard', -- e.g. "Family", "Premium"
  region TEXT NOT NULL DEFAULT 'TR', -- e.g. "TR", "US", "Global"
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  cycle TEXT NOT NULL DEFAULT 'monthly',
  category TEXT NOT NULL DEFAULT 'other',
  color TEXT NOT NULL DEFAULT '#6366F1',
  icon TEXT NOT NULL DEFAULT '📦',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subcenter_items ADD COLUMN IF NOT EXISTS plan_name TEXT NOT NULL DEFAULT 'Standard';
ALTER TABLE subcenter_items ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'TR';

CREATE INDEX IF NOT EXISTS idx_subcenter_items_user_id ON subcenter_items(user_id);

-- 2. Global Community Presets (Multi-Plan)
CREATE TABLE IF NOT EXISTS subcenter_global_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "YouTube", "Netflix"
  plan_name TEXT NOT NULL DEFAULT 'Standard', -- "Family", "Individual"
  region TEXT NOT NULL DEFAULT 'TR', -- "TR", "US"
  avg_price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  category TEXT NOT NULL DEFAULT 'other',
  color TEXT NOT NULL DEFAULT '#6366F1',
  icon TEXT NOT NULL DEFAULT '📦',
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, plan_name, region) -- Composite unique key
);

CREATE INDEX IF NOT EXISTS idx_subcenter_global_presets_lookup ON subcenter_global_presets(name, region);
