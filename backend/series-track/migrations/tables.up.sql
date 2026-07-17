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

-- TV Guide Channels Table
CREATE TABLE IF NOT EXISTS series_track.channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TV Guide Programs Table
CREATE TABLE IF NOT EXISTS series_track.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES series_track.channels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    status TEXT NOT NULL, -- 'active', 'upcoming', 'finished'
    start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    schedule_type TEXT NOT NULL, -- 'daily', 'weekly'
    total_episodes INTEGER NOT NULL DEFAULT 0,
    tmdb_id INTEGER,
    season_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add tmdb_id and season_number to programs table if they do not exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='series_track' AND table_name='programs' AND column_name='tmdb_id') THEN
        ALTER TABLE series_track.programs ADD COLUMN tmdb_id INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='series_track' AND table_name='programs' AND column_name='season_number') THEN
        ALTER TABLE series_track.programs ADD COLUMN season_number INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='series_track' AND table_name='programs' AND column_name='slot_time') THEN
        ALTER TABLE series_track.programs ADD COLUMN slot_time TEXT NOT NULL DEFAULT '19:00';
    END IF;
END $$;

-- Assign distinct slot times per channel and dedupe before unique index
DO $$
BEGIN
    WITH ranked AS (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY channel_id
                ORDER BY start_date DESC NULLS LAST, created_at DESC
            ) AS rn
        FROM series_track.programs
        WHERE status = 'active'
    )
    UPDATE series_track.programs p
    SET slot_time = CASE ranked.rn
        WHEN 1 THEN '19:00'
        WHEN 2 THEN '21:00'
        WHEN 3 THEN '23:00'
        ELSE '19:00'
    END
    FROM ranked
    WHERE p.id = ranked.id AND ranked.rn <= 3;

    WITH ranked AS (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY channel_id
                ORDER BY start_date DESC NULLS LAST, created_at DESC
            ) AS rn
        FROM series_track.programs
        WHERE status = 'active'
    )
    UPDATE series_track.programs p
    SET status = 'finished'
    FROM ranked
    WHERE p.id = ranked.id AND ranked.rn > 3;

    WITH dups AS (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY channel_id, slot_time
                ORDER BY start_date DESC NULLS LAST, created_at DESC
            ) AS rn
        FROM series_track.programs
        WHERE status = 'active'
    )
    UPDATE series_track.programs p
    SET status = 'finished'
    FROM dups
    WHERE p.id = dups.id AND dups.rn > 1;
END $$;

DROP INDEX IF EXISTS series_track.idx_tv_programs_channel_slot_active;
CREATE UNIQUE INDEX idx_tv_programs_channel_slot_active
    ON series_track.programs (channel_id, slot_time)
    WHERE status = 'active';


-- TV Guide Episodes Table
CREATE TABLE IF NOT EXISTS series_track.episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES series_track.programs(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    stream_info TEXT NOT NULL,
    release_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(program_id, episode_number)
);

-- TV Guide User Progress Table (To track who watched what in TV Flow)
CREATE TABLE IF NOT EXISTS series_track.user_program_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    episode_id UUID NOT NULL REFERENCES series_track.episodes(id) ON DELETE CASCADE,
    watched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    emoji_reaction TEXT,
    UNIQUE(user_id, episode_id)
);

-- Indexes for TV Flow
CREATE INDEX IF NOT EXISTS idx_tv_programs_channel_id ON series_track.programs(channel_id);
CREATE INDEX IF NOT EXISTS idx_tv_episodes_program_id ON series_track.episodes(program_id);
CREATE INDEX IF NOT EXISTS idx_tv_user_program_progress ON series_track.user_program_progress(user_id, episode_id);

-- Seed Channels
INSERT INTO series_track.channels (name, description, slug, icon, color) VALUES
('Drama Central', 'En yoğun dramalar, entrikalar ve sürükleyici karakter hikayeleri.', 'drama', 'Television', '#EC4899')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO series_track.channels (name, description, slug, icon, color) VALUES
('Comedy Club', 'Kahkaha garantili sitcomlar ve eğlenceli gençlik dizileri.', 'comedy', 'MaskHappy', '#F59E0B')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO series_track.channels (name, description, slug, icon, color) VALUES
('Sci-Fi Zone', 'Zaman bükümleri, distopyalar ve uzak galaksilerden maceralar.', 'scifi', 'Robot', '#3B82F6')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO series_track.channels (name, description, slug, icon, color) VALUES
('Cult Classics', 'Televizyon tarihine yön vermiş, hayran kitlesi eskimeyen kült yapımlar.', 'cult', 'Trophy', '#10B981')
ON CONFLICT (slug) DO NOTHING;

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA series_track TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA series_track TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA series_track GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA series_track GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA series_track GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

