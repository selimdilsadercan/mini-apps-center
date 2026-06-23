-- Fix ambiguous column references in business functions

-- 1. Update update_business to fix ambiguous 'id' reference
CREATE OR REPLACE FUNCTION business.update_business(
    p_business_id TEXT,
    p_name TEXT,
    p_description TEXT,
    p_logo_url TEXT,
    p_header_url TEXT,
    p_theme_color TEXT,
    p_font_family TEXT,
    p_contact_info JSONB DEFAULT '{}'::jsonb
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
    enabled_apps JSONB,
    contact_info JSONB
) AS $$
BEGIN
    UPDATE business.businesses b
    SET name = p_name,
        description = p_description,
        logo_url = p_logo_url,
        header_url = p_header_url,
        theme_color = p_theme_color,
        font_family = p_font_family,
        contact_info = p_contact_info
    WHERE b.id = p_business_id;

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
        ) as enabled_apps,
        b.contact_info
    FROM business.businesses b
    WHERE b.id = p_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update create_business to fix potential ambiguity (though it was already mostly qualified)
CREATE OR REPLACE FUNCTION business.create_business(
    p_user_id TEXT,
    p_name TEXT,
    p_description TEXT,
    p_logo_url TEXT,
    p_header_url TEXT,
    p_theme_color TEXT,
    p_contact_info JSONB DEFAULT '{}'::jsonb
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
    enabled_apps JSONB,
    contact_info JSONB
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
        theme_color,
        contact_info
    ) VALUES (
        v_user_id,
        p_name,
        p_description,
        p_logo_url,
        p_header_url,
        p_theme_color,
        p_contact_info
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
        ) as enabled_apps,
        b.contact_info
    FROM business.businesses b
    WHERE b.id = v_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION business.update_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business.create_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
