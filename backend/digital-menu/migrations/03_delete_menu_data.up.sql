-- Function to delete all menu data (categories and items) for a business
CREATE OR REPLACE FUNCTION digital_menu.delete_all_menu_data(p_business_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Deleting categories will also delete items due to ON DELETE CASCADE
    DELETE FROM digital_menu.categories
    WHERE business_id = p_business_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION digital_menu.delete_all_menu_data(TEXT) TO anon, authenticated, service_role;
