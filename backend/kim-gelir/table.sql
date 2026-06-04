-- Kim Gelir? Schema
CREATE SCHEMA IF NOT EXISTS kim_gelir;

-- Activities Table
CREATE TABLE IF NOT EXISTS kim_gelir.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    time_option TEXT NOT NULL,
    custom_time TIMESTAMP WITH TIME ZONE,
    scope TEXT NOT NULL DEFAULT 'friends',
    activity_type TEXT NOT NULL DEFAULT 'quick_invite' CHECK (activity_type IN ('quick_invite', 'plan_poll', 'time_poll')),
    options JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Invites / Responses Table
CREATE TABLE IF NOT EXISTS kim_gelir.activity_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES kim_gelir.activities(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('gelirim', 'belki', 'gelemem', 'bekliyor')) DEFAULT 'bekliyor',
    selected_options JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kg_activities_creator ON kim_gelir.activities(creator_id);
CREATE INDEX IF NOT EXISTS idx_kg_invites_user ON kim_gelir.activity_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_kg_invites_activity ON kim_gelir.activity_invites(activity_id);

-- Permissions (Grants)
GRANT USAGE ON SCHEMA kim_gelir TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kim_gelir TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kim_gelir TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA kim_gelir TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kim_gelir GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kim_gelir GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kim_gelir GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
