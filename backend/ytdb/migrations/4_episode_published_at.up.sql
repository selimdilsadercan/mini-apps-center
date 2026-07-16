ALTER TABLE public.ytdb_episodes
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
