CREATE SCHEMA IF NOT EXISTS workplaces;

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
