-- Rename existing username to full_name
ALTER TABLE public.users RENAME COLUMN username TO full_name;

-- Add a new username column for storing user handle/custom name
ALTER TABLE public.users ADD COLUMN username TEXT;

-- Update users_create_user function
DROP FUNCTION IF EXISTS users_create_user;

CREATE OR REPLACE FUNCTION users_create_user(
  clerk_id_param TEXT,
  username_param TEXT DEFAULT NULL,
  avatar_url_param TEXT DEFAULT NULL,
  full_name_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  clerk_id TEXT,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
VOLATILE
AS $$
  INSERT INTO users (clerk_id, username, avatar_url, full_name)
  VALUES (clerk_id_param, username_param, avatar_url_param, full_name_param)
  ON CONFLICT (clerk_id) DO UPDATE SET 
    username = COALESCE(EXCLUDED.username, users.username),
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
  RETURNING id, clerk_id, username, full_name, avatar_url, created_at;
$$;

-- Update users_get_user function
DROP FUNCTION IF EXISTS users_get_user;

CREATE OR REPLACE FUNCTION users_get_user(clerk_id_param TEXT)
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
  WHERE clerk_id = clerk_id_param
  LIMIT 1;
$$;
