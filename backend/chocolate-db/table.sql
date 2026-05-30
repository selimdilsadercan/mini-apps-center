CREATE SCHEMA IF NOT EXISTS chocolate_db;

CREATE TABLE chocolate_db.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chocolate_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reviewer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions
GRANT USAGE ON SCHEMA chocolate_db TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA chocolate_db TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA chocolate_db TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA chocolate_db TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
