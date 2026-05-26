-- Drop old function
DROP FUNCTION IF EXISTS hobby_center.get_user_hobbies(TEXT);

-- RPC: Get user hobbies
CREATE OR REPLACE FUNCTION hobby_center.get_user_hobbies(clerk_id_param TEXT)
RETURNS SETOF hobby_center.user_hobbies AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM hobby_center.user_hobbies
    WHERE clerk_id = clerk_id_param
    ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
