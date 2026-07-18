--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- (Empty as this is initial setup)
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- Create Schema
CREATE SCHEMA IF NOT EXISTS read_tracker;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA read_tracker TO anon, authenticated, service_role;

-- Books Table
CREATE TABLE IF NOT EXISTS read_tracker.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    total_pages INTEGER,
    current_page INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'to_read' CHECK (status IN ('reading', 'completed', 'to_read', 'dropped')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    cover_image TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Weekly Goals Table
CREATE TABLE IF NOT EXISTS read_tracker.weekly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL, -- Monday's date YYYY-MM-DD
    book_id UUID REFERENCES read_tracker.books(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'skipped')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, week_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_read_tracker_books_user_id ON read_tracker.books(user_id);
CREATE INDEX IF NOT EXISTS idx_read_tracker_weekly_goals_user_id ON read_tracker.weekly_goals(user_id);

-- Grants & Permissions
GRANT ALL ON ALL TABLES IN SCHEMA read_tracker TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA read_tracker TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA read_tracker GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA read_tracker GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA read_tracker GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
