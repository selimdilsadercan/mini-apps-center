--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------

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
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, suggestion_date)
);

GRANT ALL ON ALL TABLES IN SCHEMA film_graph TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA film_graph TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA film_graph GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA film_graph GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
