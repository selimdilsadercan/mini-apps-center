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

-- Subscription categories
CREATE TABLE IF NOT EXISTS subcenter.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#6366F1',
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO subcenter.categories (id, name, icon, color, sort_order) VALUES
  ('entertainment', 'Entertainment', '🎬', '#E50914', 1),
  ('music', 'Music', '🎵', '#1DB954', 2),
  ('ai', 'AI', '🤖', '#10A37F', 3),
  ('software', 'Software', '💻', '#6366F1', 4),
  ('design', 'Design', '✨', '#00C4CC', 5),
  ('social', 'Social', '💬', '#1877F2', 6),
  ('other', 'Other', '📦', '#64748B', 7)
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subcenter_items_user_id ON subcenter.items(user_id);
