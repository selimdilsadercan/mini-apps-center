-- 1. Fix list_businesses (Admin)
DROP FUNCTION IF EXISTS business.list_businesses(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION business.list_businesses(
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    logo_url TEXT,
    header_url TEXT,
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
        b.header_url,
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

-- 2. Fix get_business
DROP FUNCTION IF EXISTS business.get_business(TEXT);
CREATE OR REPLACE FUNCTION business.get_business(p_business_id TEXT)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    logo_url TEXT,
    header_url TEXT,
    theme_color TEXT,
    font_family TEXT,
    created_at TIMESTAMPTZ,
    owner_user_id UUID,
    enabled_apps JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.description,
        b.logo_url,
        b.header_url,
        b.theme_color,
        b.font_family,
        b.created_at,
        b.owner_user_id,
        COALESCE(
            (SELECT jsonb_agg(app_id) 
             FROM business.business_apps 
             WHERE business_id = b.id AND is_enabled = TRUE),
            '[]'::jsonb
        ) as enabled_apps
    FROM business.businesses b
    WHERE b.id = p_business_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix get_owned_businesses
DROP FUNCTION IF EXISTS business.get_owned_businesses(TEXT);
CREATE OR REPLACE FUNCTION business.get_owned_businesses(p_user_id TEXT)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    logo_url TEXT,
    header_url TEXT,
    theme_color TEXT,
    font_family TEXT,
    created_at TIMESTAMPTZ,
    owner_user_id UUID,
    enabled_apps JSONB
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.description,
        b.logo_url,
        b.header_url,
        b.theme_color,
        b.font_family,
        b.created_at,
        b.owner_user_id,
        COALESCE(
            (SELECT jsonb_agg(app_id) 
             FROM business.business_apps 
             WHERE business_id = b.id AND is_enabled = TRUE),
            '[]'::jsonb
        ) as enabled_apps
    FROM business.businesses b
    WHERE b.owner_user_id = v_user_id
    ORDER BY b.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION business.list_businesses(INTEGER, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business.get_business(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business.get_owned_businesses(TEXT) TO anon, authenticated, service_role;
