CREATE SCHEMA IF NOT EXISTS workplaces;

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
