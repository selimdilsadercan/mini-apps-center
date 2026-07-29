-- Initial schema setup for tus_tercih service

CREATE SCHEMA IF NOT EXISTS tus_tercih;

CREATE TABLE IF NOT EXISTS tus_tercih.saved_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    placement_id TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_placement UNIQUE (user_id, placement_id)
);

CREATE INDEX IF NOT EXISTS idx_tus_saved_choices_user ON tus_tercih.saved_choices(user_id);

GRANT USAGE ON SCHEMA tus_tercih TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA tus_tercih TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tus_tercih TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tus_tercih TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tus_tercih GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tus_tercih GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tus_tercih GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
