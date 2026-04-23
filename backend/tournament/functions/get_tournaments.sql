-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_get_tournaments();

-- Get All Tournaments with Participant Counts
CREATE OR REPLACE FUNCTION tournament.get_tournaments()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    icon TEXT,
    status TEXT,
    admin_user_id UUID,
    capacity INTEGER,
    format TEXT,
    created_at TIMESTAMPTZ,
    participants_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.name, t.slug, t.icon, t.status, t.admin_user_id, 
        t.capacity, t.format, t.created_at,
        COUNT(p.id) as participants_count
    FROM tournament.tournaments t
    LEFT JOIN tournament.participants p ON t.id = p.tournament_id
    GROUP BY t.id
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
