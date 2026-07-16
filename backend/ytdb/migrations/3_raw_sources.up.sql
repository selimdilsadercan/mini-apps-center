ALTER TABLE public.ytdb_series
  ADD COLUMN IF NOT EXISTS is_raw BOOLEAN DEFAULT false NOT NULL;

-- Mevcut kanal/playlist/video importlarını ham kaynak olarak işaretle
UPDATE public.ytdb_series
SET is_raw = true
WHERE source_type IN ('playlist', 'channel', 'video');
