-- Add types array column to workplaces.places
ALTER TABLE workplaces.places
  ADD COLUMN IF NOT EXISTS types TEXT[] DEFAULT '{}';

-- Migrate existing primary_type data to types array
UPDATE workplaces.places
SET types = ARRAY[primary_type]
WHERE primary_type IS NOT NULL AND (types IS NULL OR array_length(types, 1) IS NULL);

-- Create index for faster filtering on types
CREATE INDEX IF NOT EXISTS idx_workplaces_places_types ON workplaces.places USING GIN (types);
