-- Get links for a business
CREATE OR REPLACE FUNCTION business_page.get_links(p_business_id TEXT)
RETURNS TABLE (
    id UUID,
    business_id TEXT,
    title TEXT,
    url TEXT,
    icon TEXT,
    sort_order INTEGER,
    is_enabled BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM business_page.links
    WHERE links.business_id = p_business_id
    ORDER BY links.sort_order ASC, links.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add or update a link
CREATE OR REPLACE FUNCTION business_page.upsert_link(
    p_id UUID,
    p_business_id TEXT,
    p_title TEXT,
    p_url TEXT,
    p_icon TEXT,
    p_sort_order INTEGER
)
RETURNS business_page.links AS $$
DECLARE
    v_link business_page.links;
BEGIN
    INSERT INTO business_page.links (id, business_id, title, url, icon, sort_order, updated_at)
    VALUES (COALESCE(p_id, gen_random_uuid()), p_business_id, p_title, p_url, p_icon, p_sort_order, NOW())
    ON CONFLICT (id) DO UPDATE
    SET title = EXCLUDED.title,
        url = EXCLUDED.url,
        icon = EXCLUDED.icon,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    RETURNING * INTO v_link;
    
    RETURN v_link;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete a link
CREATE OR REPLACE FUNCTION business_page.delete_link(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM business_page.links WHERE id = p_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle link status
CREATE OR REPLACE FUNCTION business_page.toggle_link(p_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_new_status BOOLEAN;
BEGIN
    UPDATE business_page.links
    SET is_enabled = NOT is_enabled,
        updated_at = NOW()
    WHERE id = p_id
    RETURNING is_enabled INTO v_new_status;
    
    RETURN v_new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION business_page.get_links(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business_page.upsert_link(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business_page.delete_link(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION business_page.toggle_link(UUID) TO anon, authenticated, service_role;
