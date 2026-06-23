-- Add business_id to workplaces.places
ALTER TABLE workplaces.places ADD COLUMN IF NOT EXISTS business_id TEXT REFERENCES business.businesses(id) ON DELETE CASCADE;

-- Index for business_id
CREATE INDEX IF NOT EXISTS idx_workplaces_places_business ON workplaces.places(business_id);
