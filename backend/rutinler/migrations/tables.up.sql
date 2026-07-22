--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------

ALTER TABLE rutinler.entries DROP CONSTRAINT IF EXISTS rutinler_entries_slot_check;
ALTER TABLE rutinler.entries DROP CONSTRAINT IF EXISTS entries_period_type_check;
ALTER TABLE rutinler.entries DROP CONSTRAINT IF EXISTS rutinler_entries_period_type_check;

-- Ensure day_of_month exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'rutinler' AND table_name = 'entries' AND column_name = 'month') THEN
        ALTER TABLE rutinler.entries RENAME COLUMN "month" TO day_of_month;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'rutinler' AND table_name = 'entries' AND column_name = 'day_of_month') THEN
        ALTER TABLE rutinler.entries ADD COLUMN day_of_month SMALLINT;
    END IF;
END $$;

ALTER TABLE rutinler.entries
  ADD CONSTRAINT rutinler_entries_period_type_check
  CHECK (period_type IN ('daily', 'weekly', 'monthly', 'once', 'later'));

UPDATE rutinler.entries SET period_type = 'monthly' WHERE period_type = 'yearly';

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS rutinler;

GRANT USAGE ON SCHEMA rutinler TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS rutinler.entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'once', 'later')),
    item_slug TEXT,
    item_name TEXT NOT NULL,
    item_emoji TEXT NOT NULL DEFAULT '✨',
    daily_slot TEXT CHECK (daily_slot IS NULL OR daily_slot IN ('morning', 'afternoon', 'evening')),
    day_of_week SMALLINT CHECK (day_of_week IS NULL OR (day_of_week >= 1 AND day_of_week <= 7)),
    day_of_month SMALLINT CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    postponed_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS rutinler.completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES rutinler.entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(entry_id, completed_date)
);

CREATE INDEX IF NOT EXISTS idx_rutinler_entries_user_id ON rutinler.entries(user_id);
CREATE INDEX IF NOT EXISTS idx_rutinler_entries_user_period ON rutinler.entries(user_id, period_type);

GRANT ALL ON ALL TABLES IN SCHEMA rutinler TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA rutinler TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA rutinler GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA rutinler GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA rutinler GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
