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
