-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS kim_gelir;

-- 2. Activities Table
CREATE TABLE IF NOT EXISTS kim_gelir.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    time_option TEXT NOT NULL,
    custom_time TIMESTAMP WITH TIME ZONE,
    scope TEXT NOT NULL DEFAULT 'friends',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 3. Invites / Responses Table
CREATE TABLE IF NOT EXISTS kim_gelir.activity_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES kim_gelir.activities(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('gelirim', 'belki', 'gelemem', 'bekliyor')) DEFAULT 'bekliyor',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kg_activities_creator ON kim_gelir.activities(creator_id);
CREATE INDEX IF NOT EXISTS idx_kg_invites_user ON kim_gelir.activity_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_kg_invites_activity ON kim_gelir.activity_invites(activity_id);

-- 5. Permissions (Grants)
GRANT USAGE ON SCHEMA kim_gelir TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kim_gelir TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kim_gelir TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA kim_gelir TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kim_gelir GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kim_gelir GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kim_gelir GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 6. Functions

CREATE OR REPLACE FUNCTION kim_gelir.create_activity(
    p_creator_id TEXT,
    p_title TEXT,
    p_location TEXT,
    p_time_option TEXT,
    p_custom_time TIMESTAMP WITH TIME ZONE,
    p_invited_user_ids TEXT[]
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
        custom_time
    ) VALUES (
        p_creator_id,
        p_title,
        p_location,
        p_time_option,
        p_custom_time
    ) RETURNING id INTO v_activity_id;

    -- Creator automatically gets added with 'gelirim' response
    INSERT INTO kim_gelir.activity_invites (
        activity_id,
        user_id,
        status
    ) VALUES (
        v_activity_id,
        p_creator_id,
        'gelirim'
    );

    -- Insert invites for all invited users (excluding creator just in case)
    FOREACH v_user_id IN ARRAY p_invited_user_ids
    LOOP
        IF v_user_id <> p_creator_id THEN
            INSERT INTO kim_gelir.activity_invites (
                activity_id,
                user_id,
                status
            ) VALUES (
                v_activity_id,
                v_user_id,
                'bekliyor'
            ) ON CONFLICT (activity_id, user_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION kim_gelir.respond_to_activity(
    p_activity_id UUID,
    p_user_id TEXT,
    p_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO kim_gelir.activity_invites (
        activity_id,
        user_id,
        status,
        updated_at
    ) VALUES (
        p_activity_id,
        p_user_id,
        p_status,
        NOW()
    )
    ON CONFLICT (activity_id, user_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
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
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'userId', ai.user_id,
                        'username', iu.username,
                        'avatar', iu.avatar_url,
                        'status', ai.status,
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
