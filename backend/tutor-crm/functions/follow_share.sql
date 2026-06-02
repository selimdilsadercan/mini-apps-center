DROP FUNCTION IF EXISTS tutor_crm.follow_share(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION tutor_crm.follow_share(
    clerk_id_param TEXT,
    share_id_param UUID,
    alias_param TEXT
)
RETURNS SETOF tutor_crm.followed_shares AS $$
DECLARE
    v_followed tutor_crm.followed_shares;
BEGIN
    INSERT INTO tutor_crm.followed_shares (clerk_id, share_id, alias)
    VALUES (clerk_id_param, share_id_param, alias_param)
    ON CONFLICT (clerk_id, share_id) DO UPDATE
    SET alias = alias_param
    RETURNING * INTO v_followed;
    
    RETURN NEXT v_followed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
