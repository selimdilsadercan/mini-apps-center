-- Fix update_business function parameter name
DROP FUNCTION IF EXISTS stamp_card.update_business(TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION stamp_card.update_business(
    p_business_id TEXT,
    p_stamp_limit INTEGER,
    p_reward_title TEXT,
    p_pin_code TEXT,
    p_theme TEXT,
    p_type TEXT,
    p_market_items JSONB
)
RETURNS stamp_card.businesses AS $$
DECLARE
    v_result stamp_card.businesses;
BEGIN
    UPDATE stamp_card.businesses
    SET stamp_limit = p_stamp_limit,
        reward_title = p_reward_title,
        pin_code = p_pin_code,
        theme = p_theme,
        type = p_type,
        market_items = p_market_items
    WHERE id = p_business_id
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
