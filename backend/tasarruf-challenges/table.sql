-- Tasarruf Challenges Social Schema
CREATE SCHEMA IF NOT EXISTS tasarruf_challenges;

-- Posts table for community sharing
CREATE TABLE IF NOT EXISTS tasarruf_challenges.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_image TEXT,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) DEFAULT 0,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions
GRANT USAGE ON SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasarruf_challenges GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasarruf_challenges GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasarruf_challenges GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
