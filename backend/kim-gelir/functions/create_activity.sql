DROP FUNCTION IF EXISTS kim_gelir.create_activity;

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
