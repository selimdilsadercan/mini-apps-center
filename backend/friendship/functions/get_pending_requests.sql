DROP FUNCTION IF EXISTS public.get_pending_requests(TEXT);
DROP FUNCTION IF EXISTS friendship.get_pending_requests(TEXT);

CREATE OR REPLACE FUNCTION public.get_pending_requests(
    clerk_id_param TEXT
)
RETURNS TABLE (
    id TEXT,
    username TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.clerk_id AS id,
        u.username,
        u.avatar_url AS avatar,
        f.created_at
    FROM public.friends f
    JOIN public.users u ON f.sender_id = u.clerk_id
    WHERE (f.user_id_1 = clerk_id_param OR f.user_id_2 = clerk_id_param)
      AND f.status = 'pending'
      AND f.sender_id != clerk_id_param;
END;
$$;
