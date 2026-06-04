-- 1. Alter Tables
ALTER TABLE kim_gelir.activities ADD COLUMN IF NOT EXISTS activity_type TEXT NOT NULL DEFAULT 'quick_invite' CHECK (activity_type IN ('quick_invite', 'plan_poll', 'time_poll'));
ALTER TABLE kim_gelir.activities ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE kim_gelir.activity_invites ADD COLUMN IF NOT EXISTS selected_options JSONB DEFAULT '[]'::jsonb;

-- 2. Drop existing functions to prevent signature conflicts
DROP FUNCTION IF EXISTS kim_gelir.create_activity(TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT[]);
DROP FUNCTION IF EXISTS kim_gelir.respond_to_activity(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS kim_gelir.get_activities(TEXT);

-- 3. Redefine Functions

CREATE OR REPLACE FUNCTION kim_gelir.create_activity(
    p_creator_id TEXT,
    p_title TEXT,
    p_location TEXT,
    p_time_option TEXT,
    p_custom_time TIMESTAMP WITH TIME ZONE,
    p_invited_user_ids TEXT[],
    p_activity_type TEXT DEFAULT 'quick_invite',
    p_options JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
    v_user_id TEXT;
BEGIN
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
        p_creator_id,
        p_title,
        p_location,
        p_time_option,
        p_custom_time,
        p_activity_type,
        p_options
    ) RETURNING id INTO v_activity_id;

    -- Creator automatically gets added with 'gelirim' response / empty votes
    INSERT INTO kim_gelir.activity_invites (
        activity_id,
        user_id,
        status,
        selected_options
    ) VALUES (
        v_activity_id,
        p_creator_id,
        CASE WHEN p_activity_type = 'quick_invite' THEN 'gelirim' ELSE 'bekliyor' END,
        '[]'::jsonb
    );

    -- Insert invites for all invited users (excluding creator)
    FOREACH v_user_id IN ARRAY p_invited_user_ids
    LOOP
        IF v_user_id <> p_creator_id THEN
            INSERT INTO kim_gelir.activity_invites (
                activity_id,
                user_id,
                status,
                selected_options
            ) VALUES (
                v_activity_id,
                v_user_id,
                'bekliyor',
                '[]'::jsonb
            ) ON CONFLICT (activity_id, user_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION kim_gelir.respond_to_activity(
    p_activity_id UUID,
    p_user_id TEXT,
    p_status TEXT,
    p_selected_options JSONB DEFAULT '[]'::jsonb
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO kim_gelir.activity_invites (
        activity_id,
        user_id,
        status,
        selected_options,
        updated_at
    ) VALUES (
        p_activity_id,
        p_user_id,
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
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION kim_gelir.get_activities(
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    creator_id TEXT,
    creator_username TEXT,
    creator_avatar TEXT,
    title TEXT,
    location TEXT,
    time_option TEXT,
    custom_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    activity_type TEXT,
    options JSONB,
    responses JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.creator_id,
        cu.username AS creator_username,
        cu.avatar_url AS creator_avatar,
        a.title,
        a.location,
        a.time_option,
        a.custom_time,
        a.created_at,
        a.expires_at,
        a.activity_type,
        a.options,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'userId', ai.user_id,
                        'username', iu.username,
                        'avatar', iu.avatar_url,
                        'status', ai.status,
                        'selectedOptions', ai.selected_options,
                        'updatedAt', ai.updated_at
                    )
                )
                FROM kim_gelir.activity_invites ai
                LEFT JOIN public.users iu ON ai.user_id = iu.clerk_id
                WHERE ai.activity_id = a.id
            ),
            '[]'::jsonb
        ) AS responses
    FROM kim_gelir.activities a
    LEFT JOIN public.users cu ON a.creator_id = cu.clerk_id
    WHERE 
        -- Must be the creator OR must have an invite/response row
        a.creator_id = p_user_id
        OR EXISTS (
            SELECT 1 
            FROM kim_gelir.activity_invites ai 
            WHERE ai.activity_id = a.id AND ai.user_id = p_user_id
        )
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;
