-- Update get_business to include header_url AND enabled_apps
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

-- Update get_owned_businesses to include header_url AND enabled_apps
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

GRANT EXECUTE ON FUNCTION business.get_business(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business.get_owned_businesses(TEXT) TO anon, authenticated, service_role;
