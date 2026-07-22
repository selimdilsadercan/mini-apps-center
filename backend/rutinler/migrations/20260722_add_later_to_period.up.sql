-- Add 'later' to period_type check constraint
ALTER TABLE rutinler.entries DROP CONSTRAINT IF EXISTS rutinler_entries_period_type_check;
ALTER TABLE rutinler.entries ADD CONSTRAINT rutinler_entries_period_type_check CHECK (period_type IN ('daily', 'weekly', 'monthly', 'once', 'later'));
