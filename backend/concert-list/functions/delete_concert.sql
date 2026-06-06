DROP FUNCTION IF EXISTS concert_list.delete_concert(UUID, TEXT);

CREATE OR REPLACE FUNCTION concert_list.delete_concert(
    concert_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_rows INTEGER;
BEGIN
    -- If owner, delete the concert
    DELETE FROM concert_list.concerts
    WHERE id = concert_id_param AND user_clerk_id = clerk_id_param;
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    -- If not owner, try to remove from friends list
    IF deleted_rows = 0 THEN
        DELETE FROM concert_list.concert_friends
        WHERE concert_id = concert_id_param AND friend_clerk_id = clerk_id_param;
        GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    END IF;
    
    RETURN deleted_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
