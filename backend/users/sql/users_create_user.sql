DROP FUNCTION IF EXISTS users_create_user;

CREATE FUNCTION users_create_user(
  clerk_id_param TEXT,
  username_param TEXT DEFAULT NULL,
  avatar_url_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  clerk_id TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
VOLATILE
AS $$
  INSERT INTO users (clerk_id, username, avatar_url)
  VALUES (clerk_id_param, username_param, avatar_url_param)
  ON CONFLICT (clerk_id) DO UPDATE SET 
    username = COALESCE(EXCLUDED.username, users.username),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
  RETURNING id, clerk_id, username, avatar_url, created_at;
$$;

