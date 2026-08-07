--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------

-- 1. Migration: Initial Setup
-- Handled directly in Ideal State below

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- Create Schema
CREATE SCHEMA IF NOT EXISTS diary;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA diary TO anon, authenticated, service_role;

-- 1. Logs Table
CREATE TABLE IF NOT EXISTS diary.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- cafe, restaurant, cinema, sport, study, social, outdoor, event, custom
    title TEXT NOT NULL,
    location TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    rating NUMERIC CHECK (rating >= 1 AND rating <= 5),
    image_url TEXT,
    is_imported BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Reactions Table
CREATE TABLE IF NOT EXISTS diary.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES diary.logs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'clap', 'fire')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (log_id, user_id, reaction_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diary_user_id ON diary.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_date ON diary.logs(date);
CREATE INDEX IF NOT EXISTS idx_diary_reactions_log_id ON diary.reactions(log_id);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA diary TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA diary TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA diary GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA diary GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA diary GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
