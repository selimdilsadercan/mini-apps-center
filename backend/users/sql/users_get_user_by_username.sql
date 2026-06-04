DROP FUNCTION IF EXISTS users_get_user_by_username;

CREATE OR REPLACE FUNCTION users_get_user_by_username(username_param TEXT)
RETURNS TABLE (
  id UUID,
  clerk_id TEXT,
  username TEXT,
  full_name TEXT,
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
    full_name,
    avatar_url,
    created_at
  FROM users
  WHERE LOWER(username) = LOWER(username_param)
  LIMIT 1;
$$;
