-- Kim Gelir: custom_time TIMESTAMPTZ -> TEXT
-- Run ONLY this file in Supabase SQL Editor (do not re-run full tables.up.sql).
-- Fixes: invalid input syntax for type timestamp with time zone: "19:50"

-- 1. Column type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'kim_gelir'
          AND table_name = 'activities'
          AND column_name = 'custom_time'
          AND udt_name = 'timestamptz'
    ) THEN
        ALTER TABLE kim_gelir.activities
            ALTER COLUMN custom_time TYPE TEXT USING custom_time::TEXT;
    END IF;
END $$;

-- 2. create_activity (p_custom_time TEXT)
DROP FUNCTION IF EXISTS kim_gelir.create_activity(TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT[]);
DROP FUNCTION IF EXISTS kim_gelir.create_activity(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT[], TEXT, JSONB);
DROP FUNCTION IF EXISTS kim_gelir.create_activity(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, JSONB);

CREATE OR REPLACE FUNCTION kim_gelir.create_activity(
    p_creator_clerk_id TEXT,
    p_title TEXT,
    p_location TEXT,
    p_time_option TEXT,
    p_custom_time TEXT,
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
    v_creator_id := public.get_internal_user_id(p_creator_clerk_id);
    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'Creator not found';
    END IF;

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

    INSERT INTO kim_gelir.activity_invites (
        activity_id,
        user_id,
        status
    ) VALUES (
        v_activity_id,
        v_creator_id,
        'gelirim'
    );

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

-- 3. get_activities (custom_time TEXT in return type)
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
    custom_time TEXT,
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
        a.creator_id = v_user_id
        OR EXISTS (
            SELECT 1
            FROM kim_gelir.activity_invites ai
            WHERE ai.activity_id = a.id AND ai.user_id = v_user_id
        )
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
