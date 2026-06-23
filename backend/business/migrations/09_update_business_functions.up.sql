-- Update create_business to include header_url
DROP FUNCTION IF EXISTS business.create_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION business.create_business(
    p_user_id TEXT,
    p_name TEXT,
    p_description TEXT,
    p_logo_url TEXT,
    p_header_url TEXT,
    p_theme_color TEXT
)
RETURNS business.businesses AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result business.businesses;
BEGIN
    INSERT INTO business.businesses (
        owner_user_id,
        name,
        description,
        logo_url,
        header_url,
        theme_color
    ) VALUES (
        v_user_id,
        p_name,
        p_description,
        p_logo_url,
        p_header_url,
        p_theme_color
    ) RETURNING * INTO v_result;

    -- Add owner to business_users table as admin
    INSERT INTO business.business_users (
        business_id,
        user_id,
        role
    ) VALUES (
        v_result.id,
        v_user_id,
        'admin'
    ) ON CONFLICT DO NOTHING;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update update_business to include header_url
DROP FUNCTION IF EXISTS business.update_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION business.update_business(
    p_business_id TEXT,
    p_name TEXT,
    p_description TEXT,
    p_logo_url TEXT,
    p_header_url TEXT,
    p_theme_color TEXT,
    p_font_family TEXT
)
RETURNS business.businesses AS $$
DECLARE
    v_result business.businesses;
BEGIN
    UPDATE business.businesses
    SET name = p_name,
        description = p_description,
        logo_url = p_logo_url,
        header_url = p_header_url,
        theme_color = p_theme_color,
        font_family = p_font_family
    WHERE id = p_business_id
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update list_businesses to include header_url
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
        COUNT(*) OVER() as total_count
    FROM business.businesses b
    LEFT JOIN public.users u ON b.owner_user_id = u.id
    ORDER BY b.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION business.create_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business.update_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business.list_businesses(INTEGER, INTEGER) TO anon, authenticated, service_role;
