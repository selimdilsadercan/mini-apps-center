-- Link concerts to workplaces.places
ALTER TABLE concert_list.concerts
  ADD COLUMN IF NOT EXISTS place_id UUID REFERENCES workplaces.places(id) ON DELETE SET NULL;

ALTER TABLE concert_list.upcoming_concerts
  ADD COLUMN IF NOT EXISTS place_id UUID REFERENCES workplaces.places(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_concerts_place_id ON concert_list.concerts(place_id);
CREATE INDEX IF NOT EXISTS idx_upcoming_concerts_place_id ON concert_list.upcoming_concerts(place_id);
