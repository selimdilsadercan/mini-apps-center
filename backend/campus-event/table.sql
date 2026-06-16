-- Schema: campus_event
-- Root/ideal state of the database

CREATE SCHEMA IF NOT EXISTS campus_event;

GRANT USAGE ON SCHEMA campus_event TO anon, authenticated, service_role;

-- Kulüpler (ileride kulüp hesapları buradan yönetilecek)
CREATE TABLE IF NOT EXISTS campus_event.clubs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  university   TEXT NOT NULL,
  description  TEXT,
  logo_url     TEXT,
  owner_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clubs_university_idx ON campus_event.clubs(university);

-- Etkinlikler
CREATE TABLE IF NOT EXISTS campus_event.events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  university   TEXT NOT NULL,
  club_id      UUID REFERENCES campus_event.clubs(id) ON DELETE SET NULL,
  club_name    TEXT,
  location     TEXT,
  category     TEXT NOT NULL DEFAULT 'Diğer',
  event_date   DATE NOT NULL,
  event_time   TEXT,
  image_url    TEXT,
  created_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_university_idx ON campus_event.events(university);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON campus_event.events(event_date DESC);
CREATE INDEX IF NOT EXISTS events_category_idx ON campus_event.events(category);

GRANT ALL ON ALL TABLES IN SCHEMA campus_event TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA campus_event TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_event GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_event GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_event GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
