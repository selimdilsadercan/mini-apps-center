-- FUNCTIONS
-- 1. business.create_business
-- 2. business.get_owned_businesses
-- 3. business.get_business

-- 1. Create Business
DROP FUNCTION IF EXISTS business.create_business(TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION business.create_business(
    p_user_id TEXT,
    p_name TEXT,
    p_description TEXT,
    p_logo_url TEXT,
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
        theme_color
    ) VALUES (
        v_user_id,
        p_name,
        p_description,
        p_logo_url,
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

-- 2. Get Owned Businesses
DROP FUNCTION IF EXISTS business.get_owned_businesses(TEXT);
CREATE OR REPLACE FUNCTION business.get_owned_businesses(p_user_id TEXT)
RETURNS SETOF business.businesses AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT * FROM business.businesses
    WHERE owner_user_id = v_user_id
    ORDER BY name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Specific Business
DROP FUNCTION IF EXISTS business.get_business(UUID);
DROP FUNCTION IF EXISTS business.get_business(TEXT);
CREATE OR REPLACE FUNCTION business.get_business(p_business_id TEXT)
RETURNS SETOF business.businesses AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM business.businesses
    WHERE id = p_business_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Business
DROP FUNCTION IF EXISTS business.update_business(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION business.update_business(
    p_business_id TEXT,
    p_name TEXT,
    p_description TEXT,
    p_logo_url TEXT,
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
        theme_color = p_theme_color,
        font_family = p_font_family
    WHERE id = p_business_id
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add Business User
DROP FUNCTION IF EXISTS business.add_business_user(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION business.add_business_user(
    p_business_id TEXT,
    p_user_id TEXT, -- clerk_id
    p_role TEXT DEFAULT 'member'
)
RETURNS business.business_users AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result business.business_users;
BEGIN
    INSERT INTO business.business_users (
        business_id,
        user_id,
        role
    ) VALUES (
        p_business_id,
        v_user_id,
        p_role
    )
    ON CONFLICT (business_id, user_id) DO UPDATE
    SET role = EXCLUDED.role
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Get Business Users
DROP FUNCTION IF EXISTS business.get_business_users(TEXT);
CREATE OR REPLACE FUNCTION business.get_business_users(p_business_id TEXT)
RETURNS TABLE (
    id UUID,
    business_id TEXT,
    user_id UUID,
    role TEXT,
    created_at TIMESTAMPTZ,
    clerk_id TEXT,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bu.id,
        bu.business_id,
        bu.user_id,
        bu.role,
        bu.created_at,
        u.clerk_id,
        u.username,
        u.full_name,
        u.avatar_url
    FROM business.business_users bu
    JOIN public.users u ON bu.user_id = u.id
    WHERE bu.business_id = p_business_id
    ORDER BY bu.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Remove Business User
DROP FUNCTION IF EXISTS business.remove_business_user(TEXT, TEXT);
CREATE OR REPLACE FUNCTION business.remove_business_user(
    p_business_id TEXT,
    p_user_id TEXT -- clerk_id
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    DELETE FROM business.business_users
    WHERE business_id = p_business_id AND user_id = v_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. List All Businesses (Admin Only)
DROP FUNCTION IF EXISTS business.list_businesses(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION business.list_businesses(
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
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

-- Grants
GRANT EXECUTE ON FUNCTION business.list_businesses(INTEGER, INTEGER) TO anon, authenticated, service_role;
