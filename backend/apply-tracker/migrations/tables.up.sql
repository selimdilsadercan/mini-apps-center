--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) below.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

ALTER TABLE apply_tracker.applications ADD COLUMN IF NOT EXISTS cv_html TEXT;
ALTER TABLE apply_tracker.applications ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

-- Fix check constraints in case they are outdated
ALTER TABLE apply_tracker.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE apply_tracker.applications ADD CONSTRAINT applications_status_check CHECK (status IN ('to_apply', 'applied', 'accepted', 'rejected', 'withdrawn'));

ALTER TABLE apply_tracker.applications DROP CONSTRAINT IF EXISTS applications_priority_check;
ALTER TABLE apply_tracker.applications ADD CONSTRAINT applications_priority_check CHECK (priority IN ('low', 'medium', 'high'));

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- Create Schema
CREATE SCHEMA IF NOT EXISTS apply_tracker;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA apply_tracker TO anon, authenticated, service_role;

-- Applications Table
CREATE TABLE IF NOT EXISTS apply_tracker.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role_title TEXT,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'to_apply',
    priority TEXT NOT NULL DEFAULT 'medium',
    notes TEXT,
    cv_html TEXT,
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT applications_status_check CHECK (status IN ('to_apply', 'applied', 'accepted', 'rejected', 'withdrawn')),
    CONSTRAINT applications_priority_check CHECK (priority IN ('low', 'medium', 'high'))
);

-- Index
CREATE INDEX IF NOT EXISTS idx_apply_tracker_user_id ON apply_tracker.applications(user_id);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA apply_tracker TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA apply_tracker TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA apply_tracker GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA apply_tracker GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
