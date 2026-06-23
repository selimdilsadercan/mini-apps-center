-- 05_fix_list_businesses_type.up.sql

-- Drop old versions to avoid conflicts
DROP FUNCTION IF EXISTS business.list_businesses(INTEGER, INTEGER);

-- Create new version with correct TEXT type for id
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
    enabled_apps JSONB,
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
        COALESCE(
            (SELECT jsonb_agg(app_id) 
             FROM business.business_apps 
             WHERE business_id = b.id AND is_enabled = TRUE),
            '[]'::jsonb
        ) as enabled_apps,
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
