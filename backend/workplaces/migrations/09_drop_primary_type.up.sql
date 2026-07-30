-- 1. Sync primary_type to types array (handling comma-separated strings)
UPDATE workplaces.places
SET types = regexp_split_to_array(primary_type, '\s*,\s*')
WHERE primary_type IS NOT NULL;

-- 2. Drop the index on primary_type
DROP INDEX IF EXISTS workplaces.idx_workplaces_places_primary_type;

-- 3. Drop the primary_type column
ALTER TABLE workplaces.places
  DROP COLUMN IF EXISTS primary_type;
