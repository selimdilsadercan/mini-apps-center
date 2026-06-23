-- Clean up old function versions to avoid ambiguity
DROP FUNCTION IF EXISTS business.create_business(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS business.update_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS business.list_businesses(INTEGER, INTEGER);

-- Re-verify current versions have correct grants
GRANT EXECUTE ON FUNCTION business.create_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business.update_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business.list_businesses(INTEGER, INTEGER) TO anon, authenticated, service_role;
