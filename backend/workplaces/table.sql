-- Create schema
CREATE SCHEMA IF NOT EXISTS workplaces;

-- Grant permissions
GRANT USAGE ON SCHEMA workplaces TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA workplaces GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA workplaces GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA workplaces GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Places table
CREATE TABLE workplaces.places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    note TEXT,
    url TEXT,
    tags TEXT[] DEFAULT '{}',
    wifi BOOLEAN DEFAULT FALSE,
    parking BOOLEAN DEFAULT FALSE,
    power_outlets BOOLEAN DEFAULT FALSE,
    quiet_level INTEGER DEFAULT 3, -- 1-5
    suggested_by TEXT, -- user name or id
    latitude NUMERIC,
    longitude NUMERIC,
    district TEXT,
    image_url TEXT,
    address TEXT,
    rating NUMERIC,
    user_ratings_total INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON workplaces.places TO anon, authenticated, service_role;

-- User favorites (places to revisit)
CREATE TABLE IF NOT EXISTS workplaces.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES workplaces.places(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (place_id, clerk_id)
);

CREATE INDEX IF NOT EXISTS idx_workplaces_favorites_clerk_id ON workplaces.favorites(clerk_id);
CREATE INDEX IF NOT EXISTS idx_workplaces_favorites_place_id ON workplaces.favorites(place_id);

GRANT ALL ON workplaces.favorites TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS workplaces.visited (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES workplaces.places(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (place_id, clerk_id)
);

CREATE INDEX IF NOT EXISTS idx_workplaces_visited_clerk_id ON workplaces.visited(clerk_id);
CREATE INDEX IF NOT EXISTS idx_workplaces_visited_place_id ON workplaces.visited(place_id);

GRANT ALL ON workplaces.visited TO anon, authenticated, service_role;
