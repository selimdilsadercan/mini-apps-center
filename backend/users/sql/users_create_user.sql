DROP FUNCTION IF EXISTS users_create_user;

CREATE FUNCTION users_create_user(clerk_id_param TEXT)
RETURNS TABLE (
  id UUID,
  clerk_id TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
VOLATILE
AS $$
  INSERT INTO users (clerk_id)
  VALUES (clerk_id_param)
  ON CONFLICT (clerk_id) DO UPDATE SET clerk_id = EXCLUDED.clerk_id
  RETURNING id, clerk_id, created_at;
$$;
