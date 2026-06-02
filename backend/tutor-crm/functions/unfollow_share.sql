DROP FUNCTION IF EXISTS tutor_crm.unfollow_share(TEXT, UUID);

CREATE OR REPLACE FUNCTION tutor_crm.unfollow_share(
    clerk_id_param TEXT,
    share_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM tutor_crm.followed_shares 
    WHERE clerk_id = clerk_id_param AND share_id = share_id_param;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
