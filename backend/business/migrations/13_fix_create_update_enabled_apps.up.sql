-- Update create_business to return full structure including enabled_apps
DROP FUNCTION IF EXISTS business.create_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION business.create_business(
    p_user_id TEXT,
    p_name TEXT,
    p_description TEXT,
    p_logo_url TEXT,
    p_header_url TEXT,
    p_theme_color TEXT
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
    enabled_apps JSONB
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_business_id TEXT;
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
    ) RETURNING business.businesses.id INTO v_business_id;

    -- Add owner to business_users table as admin
    INSERT INTO business.business_users (
        business_id,
        user_id,
        role
    ) VALUES (
        v_business_id,
        v_user_id,
        'admin'
    ) ON CONFLICT DO NOTHING;

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
    WHERE b.id = v_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update update_business to return full structure including enabled_apps
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
    UPDATE business.businesses
    SET name = p_name,
        description = p_description,
        logo_url = p_logo_url,
        header_url = p_header_url,
        theme_color = p_theme_color,
        font_family = p_font_family
    WHERE id = p_business_id;

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
    WHERE b.id = p_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION business.create_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business.update_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
