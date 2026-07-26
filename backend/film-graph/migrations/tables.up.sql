--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'film_graph' AND table_name = 'daily_suggestions' AND column_name = 'movie_3') THEN
        ALTER TABLE film_graph.daily_suggestions ADD COLUMN movie_3 JSONB;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'film_graph' AND table_name = 'movies' AND column_name = 'imdb_rating') THEN
        ALTER TABLE film_graph.movies ADD COLUMN imdb_rating NUMERIC;
    END IF;
END $$;

-- [2026-07-26] Add Cineverse tables to film_graph schema
CREATE TABLE IF NOT EXISTS film_graph.cineverse_movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT UNIQUE NOT NULL,
    image_url TEXT,
    duration TEXT,
    genre TEXT,
    description TEXT,
    tmdb_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS film_graph.cineverse_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_title TEXT NOT NULL,
    theater_name TEXT NOT NULL,
    theater_slug TEXT NOT NULL,
    time TEXT NOT NULL,
    date DATE NOT NULL,
    booking_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(movie_title, theater_slug, time, date)
);

CREATE INDEX IF NOT EXISTS idx_film_graph_cineverse_sessions_date ON film_graph.cineverse_sessions(date);
CREATE INDEX IF NOT EXISTS idx_film_graph_cineverse_sessions_theater ON film_graph.cineverse_sessions(theater_slug);

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS film_graph;

GRANT USAGE ON SCHEMA film_graph TO anon, authenticated, service_role;

-- 1. User Saved Movies
CREATE TABLE IF NOT EXISTS film_graph.user_films (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    movie_id TEXT NOT NULL,
    title TEXT NOT NULL,
    year INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'want' or 'watched'
    poster_url TEXT,
    vote_average NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, movie_id)
);

-- 2. Ignored Movies
CREATE TABLE IF NOT EXISTS film_graph.user_ignored (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    movie_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, movie_id)
);

-- 3. Daily Suggestions
CREATE TABLE IF NOT EXISTS film_graph.daily_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    suggestion_date DATE DEFAULT CURRENT_DATE NOT NULL,
    movie_1 JSONB, -- Stores full movie metadata
    movie_2 JSONB, -- Stores full movie metadata
    movie_3 JSONB, -- Stores full movie metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, suggestion_date)
);

-- 4. Catalog Movies (Local Movies Cache)
CREATE TABLE IF NOT EXISTS film_graph.movies (
    id TEXT PRIMARY KEY,
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
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Cineverse Movies Table
CREATE TABLE IF NOT EXISTS film_graph.cineverse_movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT UNIQUE NOT NULL,
    image_url TEXT,
    duration TEXT,
    genre TEXT,
    description TEXT,
    tmdb_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Cineverse Sessions Table
CREATE TABLE IF NOT EXISTS film_graph.cineverse_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_title TEXT NOT NULL,
    theater_name TEXT NOT NULL,
    theater_slug TEXT NOT NULL,
    time TEXT NOT NULL,
    date DATE NOT NULL,
    booking_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(movie_title, theater_slug, time, date)
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_film_graph_cineverse_sessions_date ON film_graph.cineverse_sessions(date);
CREATE INDEX IF NOT EXISTS idx_film_graph_cineverse_sessions_theater ON film_graph.cineverse_sessions(theater_slug);

GRANT ALL ON ALL TABLES IN SCHEMA film_graph TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA film_graph TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA film_graph GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA film_graph GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
