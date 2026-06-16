-- Migration: 01_init
-- Creates campus_event schema, tables, and RPC functions.

CREATE SCHEMA IF NOT EXISTS campus_event;

GRANT USAGE ON SCHEMA campus_event TO anon, authenticated, service_role;

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

CREATE TABLE IF NOT EXISTS campus_event.events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  university    TEXT NOT NULL,
  club_id       UUID REFERENCES campus_event.clubs(id) ON DELETE SET NULL,
  club_name     TEXT,
  location      TEXT,
  category      TEXT NOT NULL DEFAULT 'Diğer',
  event_date    DATE NOT NULL,
  event_time    TEXT,
  image_url     TEXT,
  created_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_university_idx ON campus_event.events(university);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON campus_event.events(event_date DESC);
CREATE INDEX IF NOT EXISTS events_category_idx ON campus_event.events(category);

GRANT ALL ON ALL TABLES IN SCHEMA campus_event TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA campus_event TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_event GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_event GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_event GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ── RPC: get_events ───────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS campus_event.get_events(TEXT, TEXT);

CREATE OR REPLACE FUNCTION campus_event.get_events(
  p_university TEXT DEFAULT NULL,
  p_category   TEXT DEFAULT NULL
)
RETURNS TABLE (
  id               UUID,
  title            TEXT,
  description      TEXT,
  university       TEXT,
  club_id          UUID,
  club_name        TEXT,
  location         TEXT,
  category         TEXT,
  event_date       DATE,
  event_time       TEXT,
  image_url        TEXT,
  creator_username TEXT,
  creator_avatar   TEXT,
  created_at       TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.university,
    e.club_id,
    COALESCE(cl.name, e.club_name) AS club_name,
    e.location,
    e.category,
    e.event_date,
    e.event_time,
    e.image_url,
    u.username AS creator_username,
    u.avatar_url AS creator_avatar,
    e.created_at
  FROM campus_event.events e
  LEFT JOIN campus_event.clubs cl ON cl.id = e.club_id
  LEFT JOIN public.users u ON u.id = e.created_by_id
  WHERE (p_university IS NULL OR e.university = p_university)
    AND (p_category IS NULL OR e.category = p_category)
  ORDER BY e.event_date ASC, e.created_at DESC;
END;
$$;

-- ── RPC: add_event ────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS campus_event.add_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION campus_event.add_event(
  p_creator_clerk_id TEXT,
  p_title            TEXT,
  p_university       TEXT,
  p_event_date       DATE,
  p_description      TEXT DEFAULT NULL,
  p_club_name        TEXT DEFAULT NULL,
  p_location         TEXT DEFAULT NULL,
  p_category         TEXT DEFAULT 'Diğer',
  p_event_time       TEXT DEFAULT NULL,
  p_image_url        TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id UUID;
  v_event_id   UUID;
BEGIN
  v_creator_id := public.get_internal_user_id(p_creator_clerk_id);

  INSERT INTO campus_event.events (
    title, description, university, club_name, location,
    category, event_date, event_time, image_url, created_by_id
  ) VALUES (
    p_title, p_description, p_university, p_club_name, p_location,
    p_category, p_event_date, p_event_time, p_image_url, v_creator_id
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- ── RPC: get_universities ─────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS campus_event.get_universities();

CREATE OR REPLACE FUNCTION campus_event.get_universities()
RETURNS TABLE (university TEXT, event_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT university, COUNT(*)::BIGINT AS event_count
  FROM campus_event.events
  GROUP BY university
  ORDER BY event_count DESC, university ASC;
$$;

GRANT ALL ON ALL FUNCTIONS IN SCHEMA campus_event TO anon, authenticated, service_role;
