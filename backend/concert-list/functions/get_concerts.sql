DROP FUNCTION IF EXISTS concert_list.get_concerts(TEXT);

CREATE OR REPLACE FUNCTION concert_list.get_concerts(clerk_id_param TEXT)
RETURNS SETOF concert_list.concerts AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM concert_list.concerts
    WHERE user_clerk_id = clerk_id_param
    ORDER BY date DESC, created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
