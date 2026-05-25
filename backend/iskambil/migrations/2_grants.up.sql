-- Migrations Step 2: Grant permissions for the newly created schema
GRANT USAGE ON SCHEMA iskambil TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA iskambil TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA iskambil TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA iskambil TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
