--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- Create Schema
CREATE SCHEMA IF NOT EXISTS series_track;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA series_track TO anon, authenticated, service_role;

-- User Series Table (The series a user has added to their list)
CREATE TABLE IF NOT EXISTS series_track.user_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    poster_path TEXT,
    backdrop_path TEXT,
    status TEXT NOT NULL DEFAULT 'watching' CHECK (status IN ('watching', 'plan_to_watch', 'completed', 'dropped')),
    watch_url_slug TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, tmdb_id)
);

-- Add watch_url_slug if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='series_track' AND table_name='user_series' AND column_name='watch_url_slug') THEN
        ALTER TABLE series_track.user_series ADD COLUMN watch_url_slug TEXT;
    END IF;
END $$;

-- User Progress Table (Which episodes a user has watched)
CREATE TABLE IF NOT EXISTS series_track.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    series_id UUID NOT NULL REFERENCES series_track.user_series(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    watched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, series_id, season_number, episode_number)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_series_track_user_id ON series_track.user_series(user_id);
CREATE INDEX IF NOT EXISTS idx_series_track_progress_user_id ON series_track.user_progress(user_id);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA series_track TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA series_track TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA series_track GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA series_track GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
