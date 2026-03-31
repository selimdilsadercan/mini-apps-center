-- Subscription Center: Table creation
CREATE TABLE IF NOT EXISTS subcenter_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, 
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  cycle TEXT NOT NULL DEFAULT 'monthly',
  category TEXT NOT NULL DEFAULT 'other',
  color TEXT NOT NULL DEFAULT '#6366F1',
  icon TEXT NOT NULL DEFAULT '📦',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration for existing table (converting from UUID to TEXT):
ALTER TABLE subcenter_items DROP CONSTRAINT IF EXISTS subcenter_items_user_id_fkey;
ALTER TABLE subcenter_items ALTER COLUMN user_id TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_subcenter_items_user_id ON subcenter_items(user_id);
