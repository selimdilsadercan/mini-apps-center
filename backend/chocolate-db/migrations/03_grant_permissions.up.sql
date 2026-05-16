-- Grant usage on the schema
GRANT USAGE ON SCHEMA chocolate_db TO anon, authenticated, service_role;

-- Grant permissions on all existing tables
GRANT ALL ON ALL TABLES IN SCHEMA chocolate_db TO anon, authenticated, service_role;

-- Grant permissions on all sequences (for IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA chocolate_db TO anon, authenticated, service_role;

-- Grant permissions on all functions (for RPC)
GRANT ALL ON ALL FUNCTIONS IN SCHEMA chocolate_db TO anon, authenticated, service_role;

-- Ensure future tables/functions also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
