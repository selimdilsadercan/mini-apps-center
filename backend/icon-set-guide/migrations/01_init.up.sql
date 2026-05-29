-- 1. Create the schema
CREATE SCHEMA IF NOT EXISTS icon_set_guide;

-- 2. Create tables
CREATE TABLE IF NOT EXISTS icon_set_guide.icon_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    license TEXT NOT NULL,
    frameworks TEXT[] NOT NULL DEFAULT '{}',
    styles TEXT[] NOT NULL DEFAULT '{}',
    best_for TEXT[] NOT NULL DEFAULT '{}',
    vibes TEXT[] NOT NULL DEFAULT '{}',
    website_url TEXT NOT NULL,
    github_url TEXT,
    npm_command TEXT,
    detailed_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS icon_set_guide.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL,
    icon_set_id TEXT NOT NULL REFERENCES icon_set_guide.icon_sets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (clerk_id, icon_set_id)
);

-- 3. Create indices
CREATE INDEX IF NOT EXISTS idx_icon_sets_guide_fav_clerk ON icon_set_guide.favorites(clerk_id);

-- 4. Set grants
GRANT USAGE ON SCHEMA icon_set_guide TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA icon_set_guide TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA icon_set_guide TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA icon_set_guide TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA icon_set_guide GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA icon_set_guide GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA icon_set_guide GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
