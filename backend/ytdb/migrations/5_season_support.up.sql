ALTER TABLE public.ytdb_episodes 
ADD COLUMN IF NOT EXISTS season_number INTEGER NOT NULL DEFAULT 1;

-- Create an index to optimize sorting/filtering by season and episode
CREATE INDEX IF NOT EXISTS idx_ytdb_episodes_series_season_episode 
ON public.ytdb_episodes(series_id, season_number, episode_number);
