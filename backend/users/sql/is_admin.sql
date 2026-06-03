DROP FUNCTION IF EXISTS public.is_admin(TEXT);

CREATE OR REPLACE FUNCTION public.is_admin(p_clerk_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT role = 'admin' FROM public.users WHERE clerk_id = p_clerk_id LIMIT 1),
        FALSE
    );
$$;
