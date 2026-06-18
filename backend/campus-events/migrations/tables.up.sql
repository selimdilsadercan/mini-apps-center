-- Create Schema
CREATE SCHEMA IF NOT EXISTS campus_events;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA campus_events TO anon, authenticated, service_role;

-- 1. Campus Events Table
CREATE TABLE IF NOT EXISTS campus_events.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    university TEXT NOT NULL, -- e.g. 'itu', 'boun', 'odtu' etc
    location TEXT, -- building, room, campus division
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    image_url TEXT,
    organizer_club TEXT, -- name of organizing student club
    added_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Event Attendees Table (Who is going, interested)
CREATE TABLE IF NOT EXISTS campus_events.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES campus_events.events(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('going', 'interested')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campus_events_university ON campus_events.events(university);
CREATE INDEX IF NOT EXISTS idx_campus_events_date ON campus_events.events(event_date);
CREATE INDEX IF NOT EXISTS idx_campus_events_attendance_user ON campus_events.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_campus_events_attendance_event ON campus_events.attendance(event_id);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA campus_events TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA campus_events TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_events GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_events GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_events GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
