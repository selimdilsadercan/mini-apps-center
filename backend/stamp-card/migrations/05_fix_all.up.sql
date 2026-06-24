ALTER TABLE stamp_card.businesses ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'silver';
ALTER TABLE stamp_card.businesses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'stamp';
ALTER TABLE stamp_card.businesses ADD COLUMN IF NOT EXISTS market_items JSONB DEFAULT '[]';

-- Re-create functions to ensure they match the latest schema
DROP FUNCTION IF EXISTS stamp_card.get_businesses();
DROP FUNCTION IF EXISTS stamp_card.get_user_data(TEXT);
DROP FUNCTION IF EXISTS stamp_card.create_business(TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS stamp_card.create_business(TEXT, INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS stamp_card.update_business(TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS stamp_card.update_business(TEXT, INTEGER, TEXT, TEXT, TEXT);

-- Update get_businesses function
CREATE OR REPLACE FUNCTION stamp_card.get_businesses()
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    logo_url TEXT,
    stamp_limit INTEGER,
    reward_title TEXT,
    created_at TIMESTAMPTZ,
    theme TEXT,
    type TEXT,
    market_items JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT sb.id, b.name, b.description, b.logo_url, sb.stamp_limit, sb.reward_title, sb.created_at, sb.theme, sb.type, sb.market_items
    FROM stamp_card.businesses sb
    JOIN business.businesses b ON sb.id = b.id
    ORDER BY b.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_user_data function
CREATE OR REPLACE FUNCTION stamp_card.get_user_data(p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_cards JSONB;
    v_rewards JSONB;
    v_my_businesses JSONB;
BEGIN
    -- Get active cards
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', uc.id,
        'business_id', uc.business_id,
        'stamps_count', uc.stamps_count,
        'completed_count', uc.completed_count,
        'updated_at', uc.updated_at,
        'business_name', b.name,
        'business_logo', b.logo_url,
        'business_reward', sb.reward_title,
        'stamp_limit', sb.stamp_limit,
        'theme', sb.theme,
        'type', sb.type,
        'market_items', sb.market_items
    )), '[]'::jsonb)
    INTO v_cards
    FROM stamp_card.user_cards uc
    JOIN stamp_card.businesses sb ON uc.business_id = sb.id
    JOIN business.businesses b ON sb.id = b.id
    WHERE uc.user_id = v_user_id;

    -- Get redeemed rewards
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', rr.id,
        'business_id', rr.business_id,
        'reward_title', rr.reward_title,
        'is_used', rr.is_used,
        'redeemed_at', rr.redeemed_at,
        'business_name', b.name,
        'business_logo', b.logo_url
    ) ORDER BY rr.redeemed_at DESC), '[]'::jsonb)
    INTO v_rewards
    FROM stamp_card.redeemed_rewards rr
    JOIN stamp_card.businesses sb ON rr.business_id = sb.id
    JOIN business.businesses b ON sb.id = b.id
    WHERE rr.user_id = v_user_id;

    -- Get user's owned businesses
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', sb.id,
        'name', b.name,
        'description', b.description,
        'logo_url', b.logo_url,
        'stamp_limit', sb.stamp_limit,
        'reward_title', sb.reward_title,
        'pin_code', sb.pin_code,
        'created_at', sb.created_at,
        'theme', sb.theme,
        'type', sb.type,
        'market_items', sb.market_items
    )), '[]'::jsonb)
    INTO v_my_businesses
    FROM stamp_card.businesses sb
    JOIN business.businesses b ON sb.id = b.id
    WHERE b.owner_user_id = v_user_id;

    RETURN jsonb_build_object(
        'cards', v_cards,
        'rewards', v_rewards,
        'my_businesses', v_my_businesses
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update create_business function
CREATE OR REPLACE FUNCTION stamp_card.create_business(
    p_business_id TEXT,
    p_stamp_limit INTEGER,
    p_reward_title TEXT,
    p_pin_code TEXT,
    p_theme TEXT DEFAULT 'silver',
    p_type TEXT DEFAULT 'stamp',
    p_market_items JSONB DEFAULT '[]'::jsonb
)
RETURNS stamp_card.businesses AS $$
DECLARE
    v_result stamp_card.businesses;
BEGIN
    INSERT INTO stamp_card.businesses (
        id,
        stamp_limit,
        reward_title,
        pin_code,
        theme,
        type,
        market_items
    ) VALUES (
        p_business_id,
        p_stamp_limit,
        p_reward_title,
        p_pin_code,
        p_theme,
        p_type,
        p_market_items
    ) RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update update_business function
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
