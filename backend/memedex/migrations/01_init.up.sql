-- Memedex Schema
CREATE SCHEMA IF NOT EXISTS memedex;

-- Memes table
CREATE TABLE IF NOT EXISTS memedex.memes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    context TEXT NOT NULL,
    example TEXT NOT NULL,
    trend_status TEXT NOT NULL, -- 'Trending', 'Classic', 'Dead'
    media_url TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    likes_count INT NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL DEFAULT 'Anonymous',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memedex_memes_title ON memedex.memes(title);
CREATE INDEX IF NOT EXISTS idx_memedex_memes_likes ON memedex.memes(likes_count DESC);

-- Grants
GRANT USAGE ON SCHEMA memedex TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA memedex TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA memedex TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA memedex TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA memedex GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA memedex GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA memedex GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

