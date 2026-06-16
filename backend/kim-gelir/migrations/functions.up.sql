-- FUNCTIONS
-- 1. kim_gelir.create_activity
-- 2. kim_gelir.get_activities
-- 3. kim_gelir.respond_to_activity

-- 1. Create Activity
DROP FUNCTION IF EXISTS kim_gelir.create_activity(TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT[]);
DROP FUNCTION IF EXISTS kim_gelir.create_activity(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT[], TEXT, JSONB);

CREATE OR REPLACE FUNCTION kim_gelir.create_activity(
    p_creator_clerk_id TEXT,
    p_title TEXT,
    p_location TEXT,
    p_time_option TEXT,
    p_custom_time TIMESTAMPTZ,
    p_invited_clerk_ids TEXT[],
    p_activity_type TEXT DEFAULT 'quick_invite',
    p_options JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
    v_creator_id UUID;
    v_invited_clerk_id TEXT;
    v_invited_user_id UUID;
BEGIN
    -- Get creator internal ID
    v_creator_id := public.get_internal_user_id(p_creator_clerk_id);
    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'Creator not found';
    END IF;

    -- Insert the activity
    INSERT INTO kim_gelir.activities (
        creator_id,
        title,
        location,
        time_option,
        custom_time,
        activity_type,
        options
    ) VALUES (
        v_creator_id,
        p_title,
        p_location,
        p_time_option,
        p_custom_time,
        p_activity_type,
        p_options
    ) RETURNING id INTO v_activity_id;

    -- Creator automatically gets added with 'gelirim' response
    INSERT INTO kim_gelir.activity_invites (
        activity_id,
        user_id,
        status
    ) VALUES (
        v_activity_id,
        v_creator_id,
        'gelirim'
    );

    -- Insert invites for all invited users
    FOREACH v_invited_clerk_id IN ARRAY p_invited_clerk_ids
    LOOP
        v_invited_user_id := public.get_internal_user_id(v_invited_clerk_id);
        IF v_invited_user_id IS NOT NULL AND v_invited_user_id <> v_creator_id THEN
            INSERT INTO kim_gelir.activity_invites (
                activity_id,
                user_id,
                status
            ) VALUES (
                v_activity_id,
                v_invited_user_id,
                'bekliyor'
            ) ON CONFLICT (activity_id, user_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Activities
DROP FUNCTION IF EXISTS kim_gelir.get_activities(TEXT);
CREATE OR REPLACE FUNCTION kim_gelir.get_activities(
    p_clerk_id TEXT
)
RETURNS TABLE (
    id UUID,
    creator_id UUID,
    creator_clerk_id TEXT,
    creator_username TEXT,
    creator_avatar TEXT,
    title TEXT,
    location TEXT,
    time_option TEXT,
    custom_time TIMESTAMPTZ,
    activity_type TEXT,
    options JSONB,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    responses JSONB
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_clerk_id);

    RETURN QUERY
    SELECT 
        a.id,
        a.creator_id,
        cu.clerk_id AS creator_clerk_id,
        cu.username AS creator_username,
        cu.avatar_url AS creator_avatar,
        a.title,
        a.location,
        a.time_option,
        a.custom_time,
        a.activity_type,
        a.options,
        a.created_at,
        a.expires_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'userId', iu.clerk_id,
                        'username', iu.username,
                        'avatar', iu.avatar_url,
                        'status', ai.status,
                        'selectedOptions', ai.selected_options,
                        'updatedAt', ai.updated_at
                    )
                )
                FROM kim_gelir.activity_invites ai
                LEFT JOIN public.users iu ON ai.user_id = iu.id
                WHERE ai.activity_id = a.id
            ),
            '[]'::jsonb
        ) AS responses
    FROM kim_gelir.activities a
    LEFT JOIN public.users cu ON a.creator_id = cu.id
    WHERE 
        -- Must be the creator OR must have an invite/response row
        a.creator_id = v_user_id
        OR EXISTS (
            SELECT 1 
            FROM kim_gelir.activity_invites ai 
            WHERE ai.activity_id = a.id AND ai.user_id = v_user_id
        )
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Respond to Activity
DROP FUNCTION IF EXISTS kim_gelir.respond_to_activity(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS kim_gelir.respond_to_activity(UUID, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION kim_gelir.respond_to_activity(
    p_activity_id UUID,
    p_clerk_id TEXT,
    p_status TEXT,
    p_selected_options JSONB DEFAULT '[]'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_clerk_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO kim_gelir.activity_invites (
        activity_id,
        user_id,
        status,
        selected_options,
        updated_at
    ) VALUES (
        p_activity_id,
        v_user_id,
        p_status,
        p_selected_options,
        NOW()
    )
    ON CONFLICT (activity_id, user_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        selected_options = EXCLUDED.selected_options,
        updated_at = NOW();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
