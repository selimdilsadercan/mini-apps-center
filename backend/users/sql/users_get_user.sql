DROP FUNCTION IF EXISTS users_get_user;

CREATE FUNCTION users_get_user(clerk_id_param TEXT)
RETURNS TABLE (
  id UUID,
  clerk_id TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    clerk_id,
    username,
    avatar_url,
    created_at
  FROM users
  WHERE clerk_id = clerk_id_param
  LIMIT 1;
$$;

