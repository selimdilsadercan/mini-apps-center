DROP FUNCTION IF EXISTS users_get_user;

CREATE FUNCTION users_get_user(clerk_id_param TEXT)
RETURNS TABLE (
  id UUID,
  clerk_id TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    clerk_id,
    created_at
  FROM users
  WHERE clerk_id = clerk_id_param
  LIMIT 1;
$$;
