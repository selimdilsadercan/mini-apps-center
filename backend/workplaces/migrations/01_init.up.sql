CREATE SCHEMA IF NOT EXISTS workplaces;

CREATE TABLE workplaces.places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    note TEXT,
    url TEXT,
    tags TEXT[] DEFAULT '{}',
    wifi BOOLEAN DEFAULT FALSE,
    parking BOOLEAN DEFAULT FALSE,
    power_outlets BOOLEAN DEFAULT FALSE,
    quiet_level INTEGER DEFAULT 3,
    suggested_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT USAGE ON SCHEMA workplaces TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA workplaces TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA workplaces TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA workplaces TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA workplaces GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA workplaces GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA workplaces GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
