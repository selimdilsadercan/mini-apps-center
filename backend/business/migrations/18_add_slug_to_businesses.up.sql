-- Add slug column to businesses table
ALTER TABLE business.businesses ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Initialize slug with id for existing businesses
UPDATE business.businesses SET slug = id WHERE slug IS NULL;

-- Create get_business_by_slug function
CREATE OR REPLACE FUNCTION business.get_business_by_slug(p_slug TEXT)
RETURNS TABLE (
    id TEXT,
    slug TEXT,
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
    RETURN QUERY
    SELECT 
        b.id,
        b.slug,
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
    WHERE b.slug = p_slug OR b.id = p_slug
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION business.get_business_by_slug(TEXT) TO anon, authenticated, service_role;

-- Update get_business to include slug
CREATE OR REPLACE FUNCTION business.get_business(p_business_id TEXT)
RETURNS TABLE (
    id TEXT,
    slug TEXT,
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
    RETURN QUERY
    SELECT 
        b.id,
        b.slug,
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
    WHERE b.id = p_business_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_owned_businesses to include slug
CREATE OR REPLACE FUNCTION business.get_owned_businesses(p_user_id TEXT)
RETURNS TABLE (
    id TEXT,
    slug TEXT,
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
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.slug,
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
    WHERE b.owner_user_id = v_user_id
    ORDER BY b.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
