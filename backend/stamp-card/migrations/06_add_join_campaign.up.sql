-- Add join_campaign function
CREATE OR REPLACE FUNCTION stamp_card.join_campaign(
    p_user_id TEXT,
    p_business_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    INSERT INTO stamp_card.user_cards (user_id, business_id, stamps_count, completed_count)
    VALUES (v_user_id, p_business_id, 0, 0)
    ON CONFLICT (user_id, business_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
