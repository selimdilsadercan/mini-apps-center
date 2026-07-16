ALTER TABLE public.ytdb_series
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT;
