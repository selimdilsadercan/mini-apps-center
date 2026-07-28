-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- Initial schema setup for yks_tercih service

-- IDEAL STATE (Current Schema)

CREATE SCHEMA IF NOT EXISTS yks_tercih;

CREATE TABLE IF NOT EXISTS yks_tercih.saved_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_program UNIQUE (user_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_choices_user ON yks_tercih.saved_choices(user_id);

-- Grants & Permissions
GRANT USAGE ON SCHEMA yks_tercih TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA yks_tercih TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA yks_tercih TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA yks_tercih TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA yks_tercih GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA yks_tercih GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA yks_tercih GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
