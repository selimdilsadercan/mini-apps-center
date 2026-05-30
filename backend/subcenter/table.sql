-- Subcenter Schema
CREATE SCHEMA IF NOT EXISTS subcenter;

-- 1. Main Subscription Items
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

-- Global Community Presets are loaded locally from backend/subcenter/data/presets.json

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subcenter_items_user_id ON subcenter.items(user_id);
