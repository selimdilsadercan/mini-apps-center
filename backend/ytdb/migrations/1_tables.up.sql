CREATE TABLE IF NOT EXISTS public.ytdb_series (
    id TEXT PRIMARY KEY DEFAULT substring(md5(random()::text), 1, 8),
    title TEXT NOT NULL,
    description TEXT DEFAULT '' NOT NULL,
    creator TEXT NOT NULL,
    youtube_id TEXT,
    category TEXT NOT NULL DEFAULT 'talk-show',
    status TEXT NOT NULL DEFAULT 'devam-ediyor',
    year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
    contexts TEXT[] DEFAULT ARRAY[]::TEXT[],
    attention_level TEXT DEFAULT 'light',
    emoji TEXT,
    gradient TEXT,
    source_type TEXT DEFAULT 'manual',
    source_id TEXT,
    source_url TEXT,
    is_raw BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ytdb_episodes (
    id TEXT PRIMARY KEY DEFAULT substring(md5(random()::text), 1, 8),
    series_id TEXT NOT NULL REFERENCES public.ytdb_series(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    episode_number INTEGER NOT NULL,
    duration TEXT DEFAULT '—',
    youtube_id TEXT NOT NULL,
    thumbnail_url TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(series_id, youtube_id)
);

CREATE INDEX IF NOT EXISTS idx_ytdb_episodes_series_id ON public.ytdb_episodes(series_id);
CREATE INDEX IF NOT EXISTS idx_ytdb_episodes_series_episode ON public.ytdb_episodes(series_id, episode_number);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
