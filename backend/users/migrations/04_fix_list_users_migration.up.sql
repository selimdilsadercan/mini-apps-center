-- 04_fix_list_users_migration.up.sql

-- Drop old versions
DROP FUNCTION IF EXISTS public.users_list_users();
DROP FUNCTION IF EXISTS public.users_list_users(INTEGER, INTEGER);

-- Create new version with pagination
CREATE OR REPLACE FUNCTION public.users_list_users(
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    id,
    username,
    full_name,
    avatar_url,
    role,
    created_at,
    COUNT(*) OVER() as total_count
  FROM public.users
  ORDER BY created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.users_list_users(INTEGER, INTEGER) TO anon, authenticated, service_role;
