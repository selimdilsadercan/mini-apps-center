-- Re-grant permissions to refresh schema cache
GRANT USAGE ON SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA suggest TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
