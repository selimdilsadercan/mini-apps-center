--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------
ALTER TABLE catalog.movies ADD COLUMN IF NOT EXISTS is_popular TEXT DEFAULT 'false' NOT NULL;
ALTER TABLE catalog.series ADD COLUMN IF NOT EXISTS is_popular TEXT DEFAULT 'false' NOT NULL;
ALTER TABLE catalog.movies ADD COLUMN IF NOT EXISTS imdb_rating NUMERIC;
ALTER TABLE catalog.movies ADD COLUMN IF NOT EXISTS is_top_rated TEXT DEFAULT 'false' NOT NULL;

-- Tip dönüşümü (eğer boolean olarak yaratıldıysa text tipine dönüştür)
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'catalog' AND table_name = 'movies' AND column_name = 'is_popular' AND data_type = 'boolean'
    ) THEN
        ALTER TABLE catalog.movies ALTER COLUMN is_popular TYPE TEXT USING (CASE WHEN is_popular THEN 'true' ELSE 'false' END);
        ALTER TABLE catalog.movies ALTER COLUMN is_popular SET DEFAULT 'false';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'catalog' AND table_name = 'series' AND column_name = 'is_popular' AND data_type = 'boolean'
    ) THEN
        ALTER TABLE catalog.series ALTER COLUMN is_popular TYPE TEXT USING (CASE WHEN is_popular THEN 'true' ELSE 'false' END);
        ALTER TABLE catalog.series ALTER COLUMN is_popular SET DEFAULT 'false';
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS catalog;

GRANT USAGE ON SCHEMA catalog TO anon, authenticated, service_role;

-- 1. Movies Table
CREATE TABLE IF NOT EXISTS catalog.movies (
    id TEXT PRIMARY KEY, -- TMDB ID
    title TEXT NOT NULL,
    original_title TEXT,
    year INTEGER,
    overview TEXT,
    vote_average NUMERIC,
    vote_count INTEGER,
    popularity NUMERIC,
    poster_url TEXT,
    backdrop_url TEXT,
    director_id TEXT,
    director_name TEXT,
    actor_ids TEXT[],
    cast_names TEXT[],
    imdb_id TEXT,
    imdb_rating NUMERIC,
    is_popular TEXT DEFAULT 'false' NOT NULL,
    is_top_rated TEXT DEFAULT 'false' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Matches Table (ESPN Cache)
CREATE TABLE IF NOT EXISTS catalog.matches (
    id TEXT PRIMARY KEY,
    sport TEXT NOT NULL,
    competition TEXT NOT NULL,
    competition_tr TEXT NOT NULL,
    competition_slug TEXT NOT NULL,
    home TEXT NOT NULL,
    away TEXT NOT NULL,
    home_logo TEXT,
    away_logo TEXT,
    home_score TEXT,
    away_score TEXT,
    state TEXT NOT NULL,
    status_text TEXT NOT NULL,
    clock TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    venue TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Series Table (TMDB Series Cache)
CREATE TABLE IF NOT EXISTS catalog.series (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT,
    overview TEXT,
    first_air_date TEXT,
    vote_average NUMERIC,
    vote_count INTEGER,
    popularity NUMERIC,
    poster_path TEXT,
    backdrop_path TEXT,
    genres TEXT[],
    is_popular TEXT DEFAULT 'false' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Seasons Table (TMDB Seasons Cache)
CREATE TABLE IF NOT EXISTS catalog.seasons (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL REFERENCES catalog.series(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    episode_count INTEGER,
    poster_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(series_id, season_number)
);

-- 5. Episodes Table (TMDB Episodes Cache)
CREATE TABLE IF NOT EXISTS catalog.episodes (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL REFERENCES catalog.series(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    overview TEXT,
    still_path TEXT,
    vote_average NUMERIC,
    air_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(series_id, season_number, episode_number)
);

GRANT ALL ON ALL TABLES IN SCHEMA catalog TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA catalog TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
