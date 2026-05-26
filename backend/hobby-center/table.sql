-- Hobby Center Schema
CREATE SCHEMA IF NOT EXISTS hobby_center;

-- Table to track user hobby status and progress
CREATE TABLE IF NOT EXISTS hobby_center.user_hobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    hobby_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('interested', 'in_progress', 'learned')),
    notes TEXT DEFAULT '',
    completed_steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clerk_id, hobby_id)
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_user_hobbies_clerk_id ON hobby_center.user_hobbies(clerk_id);

-- Yetkilendirmeler (Grants)
GRANT USAGE ON SCHEMA hobby_center TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA hobby_center TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA hobby_center TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA hobby_center TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hobby_center GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hobby_center GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hobby_center GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
