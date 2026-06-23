-- 04_update_list_businesses.up.sql

-- Drop old versions
DROP FUNCTION IF EXISTS business.list_businesses(INTEGER, INTEGER);

-- Create new version with pagination
CREATE OR REPLACE FUNCTION business.list_businesses(
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    logo_url TEXT,
    theme_color TEXT,
    font_family TEXT,
    created_at TIMESTAMPTZ,
    owner_user_id UUID,
    owner_username TEXT,
    owner_full_name TEXT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.description,
        b.logo_url,
        b.theme_color,
        b.font_family,
        b.created_at,
        b.owner_user_id,
        u.username as owner_username,
        u.full_name as owner_full_name,
        COUNT(*) OVER() as total_count
    FROM business.businesses b
    LEFT JOIN public.users u ON b.owner_user_id = u.id
    ORDER BY b.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION business.list_businesses(INTEGER, INTEGER) TO anon, authenticated, service_role;
