-- Create Schema
CREATE SCHEMA IF NOT EXISTS campus_concerts;

-- Campus Concerts Table
CREATE TABLE IF NOT EXISTS campus_concerts.concerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist TEXT NOT NULL,
    campus TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    image_url TEXT,
    added_by_clerk_id TEXT REFERENCES public.users(clerk_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS campus_concerts.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_clerk_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    concert_id UUID NOT NULL REFERENCES campus_concerts.concerts(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('went', 'going', 'interested')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_clerk_id, concert_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campus_concerts_campus ON campus_concerts.concerts(campus);
CREATE INDEX IF NOT EXISTS idx_campus_concerts_date ON campus_concerts.concerts(date);
CREATE INDEX IF NOT EXISTS idx_campus_attendance_user ON campus_concerts.attendance(user_clerk_id);
CREATE INDEX IF NOT EXISTS idx_campus_attendance_concert ON campus_concerts.attendance(concert_id);
