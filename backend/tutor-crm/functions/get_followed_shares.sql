DROP FUNCTION IF EXISTS tutor_crm.get_followed_shares(TEXT);

CREATE OR REPLACE FUNCTION tutor_crm.get_followed_shares(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    clerk_id TEXT,
    share_id UUID,
    alias TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        f.id, 
        f.clerk_id, 
        f.share_id, 
        f.alias, 
        f.created_at,
        s.is_active
    FROM tutor_crm.followed_shares f
    JOIN tutor_crm.shares s ON f.share_id = s.id
    WHERE f.clerk_id = clerk_id_param
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
