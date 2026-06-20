    -- 1. Create Schema
    CREATE SCHEMA IF NOT EXISTS stamp_card;

    -- Grant schema usage permissions
    GRANT USAGE ON SCHEMA stamp_card TO anon, authenticated, service_role;

    -- 2. Create Tables
    CREATE TABLE IF NOT EXISTS stamp_card.businesses (
        id UUID PRIMARY KEY REFERENCES business.businesses(id) ON DELETE CASCADE,
        stamp_limit INTEGER DEFAULT 8 NOT NULL,
        reward_title TEXT NOT NULL,
        pin_code VARCHAR(4) NOT NULL DEFAULT '1234',
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stamp_card.user_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        business_id UUID NOT NULL REFERENCES stamp_card.businesses(id) ON DELETE CASCADE,
        stamps_count INTEGER DEFAULT 0 NOT NULL,
        completed_count INTEGER DEFAULT 0 NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, business_id)
    );

    CREATE TABLE IF NOT EXISTS stamp_card.redeemed_rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        business_id UUID NOT NULL REFERENCES stamp_card.businesses(id) ON DELETE CASCADE,
        reward_title TEXT NOT NULL,
        is_used BOOLEAN DEFAULT FALSE NOT NULL,
        redeemed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- 3. Indexes
    CREATE INDEX IF NOT EXISTS idx_user_cards_user ON stamp_card.user_cards(user_id);
    CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_user ON stamp_card.redeemed_rewards(user_id);

    -- 4. Grants
    GRANT ALL ON ALL TABLES IN SCHEMA stamp_card TO anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA stamp_card TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA stamp_card GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA stamp_card GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA stamp_card GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

    -- 5. RPC Functions

    -- Get all businesses
    DROP FUNCTION IF EXISTS stamp_card.get_businesses();
    CREATE OR REPLACE FUNCTION stamp_card.get_businesses()
    RETURNS TABLE (
        id UUID,
        name TEXT,
        description TEXT,
        logo_url TEXT,
        stamp_limit INTEGER,
        reward_title TEXT,
        created_at TIMESTAMPTZ
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT sb.id, b.name, b.description, b.logo_url, sb.stamp_limit, sb.reward_title, sb.created_at
        FROM stamp_card.businesses sb
        JOIN business.businesses b ON sb.id = b.id
        ORDER BY b.name ASC;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Get user's cards and redeemed rewards
    DROP FUNCTION IF EXISTS stamp_card.get_user_data(TEXT);
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
            'stamp_limit', sb.stamp_limit
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
            'created_at', sb.created_at
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

    -- Add stamp to a card
    DROP FUNCTION IF EXISTS stamp_card.add_stamp(TEXT, UUID, TEXT);
    CREATE OR REPLACE FUNCTION stamp_card.add_stamp(
        p_user_id TEXT,
        p_business_id UUID,
        p_pin TEXT
    )
    RETURNS JSONB AS $$
    DECLARE
        v_user_id UUID := public.get_internal_user_id(p_user_id);
        v_correct_pin TEXT;
        v_stamp_limit INTEGER;
        v_reward_title TEXT;
        v_card stamp_card.user_cards;
        v_reward_created BOOLEAN := FALSE;
        v_new_reward_id UUID := NULL;
    BEGIN
        -- Get business details
        SELECT pin_code, stamp_limit, reward_title 
        INTO v_correct_pin, v_stamp_limit, v_reward_title
        FROM stamp_card.businesses
        WHERE id = p_business_id;

        IF v_correct_pin IS NULL THEN
             RETURN jsonb_build_object('success', FALSE, 'error', 'Business not found');
        END IF;

        -- Validate PIN
        IF v_correct_pin != p_pin THEN
            RETURN jsonb_build_object('success', FALSE, 'error', 'Invalid business PIN code');
        END IF;

        -- Check if card exists, if not create it
        INSERT INTO stamp_card.user_cards (user_id, business_id, stamps_count, completed_count)
        VALUES (v_user_id, p_business_id, 1, 0)
        ON CONFLICT (user_id, business_id) 
        DO UPDATE SET 
            stamps_count = stamp_card.user_cards.stamps_count + 1,
            updated_at = NOW()
        RETURNING * INTO v_card;

        -- Check if reward threshold reached
        IF v_card.stamps_count >= v_stamp_limit THEN
            -- Create redeemed reward
            INSERT INTO stamp_card.redeemed_rewards (user_id, business_id, reward_title)
            VALUES (v_user_id, p_business_id, v_reward_title)
            RETURNING id INTO v_new_reward_id;

            -- Reset stamps and increment completed
            UPDATE stamp_card.user_cards
            SET stamps_count = 0,
                completed_count = completed_count + 1,
                updated_at = NOW()
            WHERE id = v_card.id
            RETURNING * INTO v_card;

            v_reward_created := TRUE;
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'stamps_count', v_card.stamps_count,
            'completed_count', v_card.completed_count,
            'reward_created', v_reward_created,
            'new_reward_id', v_new_reward_id
        );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Use/Redeem a coupon (cashier side)
    DROP FUNCTION IF EXISTS stamp_card.use_reward(TEXT, UUID);
    CREATE OR REPLACE FUNCTION stamp_card.use_reward(
        p_user_id TEXT,
        p_reward_id UUID
    )
    RETURNS BOOLEAN AS $$
    DECLARE
        v_user_id UUID := public.get_internal_user_id(p_user_id);
        v_updated INTEGER;
    BEGIN
        UPDATE stamp_card.redeemed_rewards
        SET is_used = TRUE
        WHERE id = p_reward_id AND user_id = v_user_id AND is_used = FALSE;

        GET DIAGNOSTICS v_updated = ROW_COUNT;
        RETURN v_updated > 0;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create Business / Campaign
    DROP FUNCTION IF EXISTS stamp_card.create_business(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT);
    DROP FUNCTION IF EXISTS stamp_card.create_business(UUID, INTEGER, TEXT, TEXT);
    CREATE OR REPLACE FUNCTION stamp_card.create_business(
        p_business_id UUID,
        p_stamp_limit INTEGER,
        p_reward_title TEXT,
        p_pin_code TEXT
    )
    RETURNS stamp_card.businesses AS $$
    DECLARE
        v_result stamp_card.businesses;
    BEGIN
        INSERT INTO stamp_card.businesses (
            id,
            stamp_limit,
            reward_title,
            pin_code
        ) VALUES (
            p_business_id,
            p_stamp_limit,
            p_reward_title,
            p_pin_code
        ) RETURNING * INTO v_result;

        RETURN v_result;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
