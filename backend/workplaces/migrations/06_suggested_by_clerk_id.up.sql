ALTER TABLE workplaces.places
ADD COLUMN IF NOT EXISTS suggested_by_clerk_id TEXT;

CREATE INDEX IF NOT EXISTS idx_workplaces_places_suggested_by_clerk_id
ON workplaces.places(suggested_by_clerk_id);
