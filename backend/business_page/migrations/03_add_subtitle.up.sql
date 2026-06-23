-- Drop existing functions first because we are changing return types/parameters
DROP FUNCTION IF EXISTS business_page.get_links(text);
DROP FUNCTION IF EXISTS business_page.upsert_link(uuid, text, text, text, text, integer);

-- Add columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='business_page' AND table_name='links' AND column_name='subtitle') THEN
        ALTER TABLE business_page.links ADD COLUMN subtitle TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='business_page' AND table_name='links' AND column_name='app_id') THEN
        ALTER TABLE business_page.links ADD COLUMN app_id TEXT;
    END IF;
END $$;

-- Recreate get_links function with new signature
CREATE OR REPLACE FUNCTION business_page.get_links(p_business_id TEXT)
RETURNS TABLE (
    id UUID,
    business_id TEXT,
    title TEXT,
    subtitle TEXT,
    app_id TEXT,
    url TEXT,
    icon TEXT,
    sort_order INTEGER,
    is_enabled BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.business_id,
        l.title,
        l.subtitle,
        l.app_id,
        l.url,
        l.icon,
        l.sort_order,
        l.is_enabled,
        l.created_at,
        l.updated_at
    FROM business_page.links l
    WHERE l.business_id = p_business_id
    ORDER BY l.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate upsert_link function with new signature
CREATE OR REPLACE FUNCTION business_page.upsert_link(
    p_id UUID,
    p_business_id TEXT,
    p_title TEXT,
    p_subtitle TEXT,
    p_app_id TEXT,
    p_url TEXT,
    p_icon TEXT,
    p_sort_order INTEGER
) RETURNS jsonb AS $$
DECLARE
    v_link RECORD;
BEGIN
    INSERT INTO business_page.links (
        id,
        business_id,
        title,
        subtitle,
        app_id,
        url,
        icon,
        sort_order,
        updated_at
    ) VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_business_id,
        p_title,
        p_subtitle,
        p_app_id,
        p_url,
        p_icon,
        p_sort_order,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        app_id = EXCLUDED.app_id,
        url = EXCLUDED.url,
        icon = EXCLUDED.icon,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    RETURNING * INTO v_link;

    RETURN to_jsonb(v_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION business_page.get_links(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business_page.upsert_link(uuid, text, text, text, text, text, text, integer) TO anon, authenticated, service_role;
