-- City scope + venue category for merged Places/Workplaces app

ALTER TABLE workplaces.places
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS primary_type TEXT;

-- Existing records are Istanbul imports — hide from Maraş-only listing
UPDATE workplaces.places
SET city = 'istanbul'
WHERE city IS NULL;

ALTER TABLE workplaces.places
  ALTER COLUMN city SET DEFAULT 'kahramanmaras';

CREATE INDEX IF NOT EXISTS idx_workplaces_places_city ON workplaces.places(city);
CREATE INDEX IF NOT EXISTS idx_workplaces_places_primary_type ON workplaces.places(primary_type);
