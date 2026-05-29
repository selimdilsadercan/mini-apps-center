-- Create Schema
CREATE SCHEMA IF NOT EXISTS concert_list;

-- Concerts Table
CREATE TABLE IF NOT EXISTS concert_list.concerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_clerk_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    artist TEXT NOT NULL,
    date DATE NOT NULL,
    venue TEXT,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concerts_user_clerk_id ON concert_list.concerts(user_clerk_id);
CREATE INDEX IF NOT EXISTS idx_concerts_date ON concert_list.concerts(date);

-- Schema and Table Permissions (Grants)
GRANT USAGE ON SCHEMA concert_list TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA concert_list TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA concert_list TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA concert_list TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA concert_list GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA concert_list GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA concert_list GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
