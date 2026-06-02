-- 04_setup_sharing.up.sql

-- Shares table
CREATE TABLE IF NOT EXISTS tutor_crm.shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    allow_student_names BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Followed shares table
CREATE TABLE IF NOT EXISTS tutor_crm.followed_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL,
    share_id UUID NOT NULL REFERENCES tutor_crm.shares(id) ON DELETE CASCADE,
    alias TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clerk_id, share_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tutor_crm_shares_clerk_id ON tutor_crm.shares(clerk_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_followed_shares_clerk_id ON tutor_crm.followed_shares(clerk_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_followed_shares_share_id ON tutor_crm.followed_shares(share_id);

-- RPC Functions
DROP FUNCTION IF EXISTS tutor_crm.get_share_settings(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_share_settings(clerk_id_param TEXT)
RETURNS SETOF tutor_crm.shares AS $$
DECLARE
    v_share tutor_crm.shares;
BEGIN
    SELECT * INTO v_share FROM tutor_crm.shares WHERE clerk_id = clerk_id_param;
    IF NOT FOUND THEN
        INSERT INTO tutor_crm.shares (clerk_id) VALUES (clerk_id_param) RETURNING * INTO v_share;
    END IF;
    RETURN NEXT v_share;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.toggle_share(TEXT, BOOLEAN, BOOLEAN);
CREATE OR REPLACE FUNCTION tutor_crm.toggle_share(
    clerk_id_param TEXT,
    is_active_param BOOLEAN,
    allow_student_names_param BOOLEAN
)
RETURNS SETOF tutor_crm.shares AS $$
DECLARE
    v_share tutor_crm.shares;
BEGIN
    INSERT INTO tutor_crm.shares (clerk_id, is_active, allow_student_names)
    VALUES (clerk_id_param, is_active_param, allow_student_names_param)
    ON CONFLICT (clerk_id) DO UPDATE
    SET is_active = is_active_param,
        allow_student_names = allow_student_names_param
    RETURNING * INTO v_share;
    
    RETURN NEXT v_share;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.get_shared_lessons(UUID);
CREATE OR REPLACE FUNCTION tutor_crm.get_shared_lessons(share_id_param UUID)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    student_name TEXT,
    clerk_id TEXT,
    lesson_date DATE,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    next_lesson_plan TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_clerk_id TEXT;
    v_is_active BOOLEAN;
    v_allow_student_names BOOLEAN;
BEGIN
    SELECT clerk_id, is_active, allow_student_names 
    INTO v_clerk_id, v_is_active, v_allow_student_names 
    FROM tutor_crm.shares 
    WHERE id = share_id_param;

    IF v_is_active = TRUE THEN
        RETURN QUERY 
        SELECT 
            l.id, 
            l.student_id, 
            CASE WHEN v_allow_student_names = TRUE THEN s.name ELSE s.subject || ' Dersi' END as student_name, 
            l.clerk_id, 
            l.lesson_date, 
            l.start_time, 
            l.end_time, 
            CASE WHEN v_allow_student_names = TRUE THEN l.notes ELSE '' END as notes, 
            CASE WHEN v_allow_student_names = TRUE THEN l.next_lesson_plan ELSE '' END as next_lesson_plan, 
            l.status, 
            l.created_at 
        FROM tutor_crm.lessons l 
        JOIN tutor_crm.students s ON l.student_id = s.id 
        WHERE l.clerk_id = v_clerk_id 
        ORDER BY l.lesson_date DESC, l.start_time DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

DROP FUNCTION IF EXISTS tutor_crm.unfollow_share(TEXT, UUID);
CREATE OR REPLACE FUNCTION tutor_crm.unfollow_share(
    clerk_id_param TEXT,
    share_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM tutor_crm.followed_shares 
    WHERE clerk_id = clerk_id_param AND share_id = share_id_param;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.get_followed_shares(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_followed_shares(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    clerk_id TEXT,
    share_id UUID,
    alias TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        f.id, 
        f.clerk_id, 
        f.share_id, 
        f.alias, 
        f.created_at,
        s.is_active
    FROM tutor_crm.followed_shares f
    JOIN tutor_crm.shares s ON f.share_id = s.id
    WHERE f.clerk_id = clerk_id_param
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT USAGE ON SCHEMA tutor_crm TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA tutor_crm TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tutor_crm TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tutor_crm TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tutor_crm GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tutor_crm GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tutor_crm GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
