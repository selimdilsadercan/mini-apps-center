ALTER TABLE public.ytdb_series 
ADD COLUMN IF NOT EXISTS seasoning TEXT NOT NULL DEFAULT 'manual';
