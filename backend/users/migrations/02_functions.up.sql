-- Users RPC Functions with Environment Specific Lookup

-- 1. users_create_user
DROP FUNCTION IF EXISTS public.users_create_user;

CREATE OR REPLACE FUNCTION public.users_create_user(
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
  INSERT INTO public.users (clerk_id, username, avatar_url, full_name)
  VALUES (clerk_id_param, username_param, avatar_url_param, full_name_param)
  ON CONFLICT (clerk_id) DO UPDATE SET 
    username = COALESCE(EXCLUDED.username, public.users.username),
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url)
  RETURNING id, clerk_id, username, full_name, avatar_url, created_at;
$$;

-- 2. users_get_user
DROP FUNCTION IF EXISTS public.users_get_user;

CREATE OR REPLACE FUNCTION public.users_get_user(
  clerk_id_param TEXT,
  is_local_param BOOLEAN DEFAULT FALSE
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
STABLE
AS $$
  SELECT 
    id,
    clerk_id,
    username,
    full_name,
    avatar_url,
    created_at
  FROM public.users
  WHERE (is_local_param AND local_clerk_id = clerk_id_param)
     OR (NOT is_local_param AND clerk_id = clerk_id_param)
  LIMIT 1;
$$;

-- 3. users_get_user_by_username
DROP FUNCTION IF EXISTS public.users_get_user_by_username;

CREATE OR REPLACE FUNCTION public.users_get_user_by_username(username_param TEXT)
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
  FROM public.users
  WHERE LOWER(username) = LOWER(username_param)
  LIMIT 1;
$$;

-- 4. is_admin
DROP FUNCTION IF EXISTS public.is_admin(TEXT);
DROP FUNCTION IF EXISTS public.is_admin(TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.is_admin(
  p_clerk_id TEXT,
  is_local_param BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT role = 'admin' FROM public.users 
         WHERE (is_local_param AND local_clerk_id = p_clerk_id)
            OR (NOT is_local_param AND clerk_id = p_clerk_id)
         LIMIT 1),
        FALSE
    );
$$;

-- 5. update_user_app_order
DROP FUNCTION IF EXISTS public.update_user_app_order;

CREATE OR REPLACE FUNCTION public.update_user_app_order(
  clerk_id_param TEXT,
  app_order_param JSONB,
  is_local_param BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user id from clerk id (checking environment specific ID)
  SELECT id INTO v_user_id FROM public.users 
  WHERE (is_local_param AND local_clerk_id = clerk_id_param)
     OR (NOT is_local_param AND clerk_id = clerk_id_param);
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.user_preferences (user_id, app_order, updated_at)
  VALUES (v_user_id, app_order_param, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    app_order = EXCLUDED.app_order,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. get_user_preferences
DROP FUNCTION IF EXISTS public.get_user_preferences;

CREATE OR REPLACE FUNCTION public.get_user_preferences(
  clerk_id_param TEXT,
  is_local_param BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  app_order JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT up.app_order
  FROM public.user_preferences up
  JOIN public.users u ON up.user_id = u.id
  WHERE (is_local_param AND u.local_clerk_id = clerk_id_param)
     OR (NOT is_local_param AND u.clerk_id = clerk_id_param);
END;
$$ LANGUAGE plpgsql;

-- 7. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
