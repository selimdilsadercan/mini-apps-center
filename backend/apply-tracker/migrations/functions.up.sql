-- FUNCTIONS
-- 1. apply_tracker.get_applications
-- 2. apply_tracker.add_application
-- 3. apply_tracker.update_application
-- 4. apply_tracker.delete_application
-- 5. apply_tracker.bulk_import

-- 1. get_applications
DROP FUNCTION IF EXISTS apply_tracker.get_applications(TEXT);
CREATE OR REPLACE FUNCTION apply_tracker.get_applications(clerk_id_param TEXT)
RETURNS SETOF apply_tracker.applications AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    RETURN QUERY
    SELECT * FROM apply_tracker.applications
    WHERE user_id = v_user_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. add_application
DROP FUNCTION IF EXISTS apply_tracker.add_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS apply_tracker.add_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION apply_tracker.add_application(
    clerk_id_param TEXT,
    company_name_param TEXT,
    role_title_param TEXT,
    url_param TEXT,
    status_param TEXT,
    priority_param TEXT,
    notes_param TEXT,
    cv_html_param TEXT DEFAULT NULL
)
RETURNS apply_tracker.applications AS $$
DECLARE
    v_user_id UUID;
    v_new_app apply_tracker.applications;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO apply_tracker.applications (
        user_id, company_name, role_title, url, status, priority, notes, cv_html
    ) VALUES (
        v_user_id, company_name_param, role_title_param, url_param, status_param, priority_param, notes_param, cv_html_param
    ) RETURNING * INTO v_new_app;

    RETURN v_new_app;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. update_application
DROP FUNCTION IF EXISTS apply_tracker.update_application(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS apply_tracker.update_application(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION apply_tracker.update_application(
    clerk_id_param TEXT,
    id_param UUID,
    company_name_param TEXT,
    role_title_param TEXT,
    url_param TEXT,
    status_param TEXT,
    priority_param TEXT,
    notes_param TEXT,
    cv_html_param TEXT DEFAULT NULL
)
RETURNS apply_tracker.applications AS $$
DECLARE
    v_user_id UUID;
    v_updated_app apply_tracker.applications;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE apply_tracker.applications
    SET company_name = company_name_param,
        role_title = role_title_param,
        url = url_param,
        status = status_param,
        priority = priority_param,
        notes = notes_param,
        cv_html = cv_html_param,
        updated_at = NOW()
    WHERE id = id_param AND user_id = v_user_id
    RETURNING * INTO v_updated_app;

    RETURN v_updated_app;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. delete_application
DROP FUNCTION IF EXISTS apply_tracker.delete_application(UUID, TEXT);
CREATE OR REPLACE FUNCTION apply_tracker.delete_application(
    item_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    deleted_count INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    DELETE FROM apply_tracker.applications
    WHERE id = item_id_param AND user_id = v_user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. bulk_import
DROP FUNCTION IF EXISTS apply_tracker.bulk_import(TEXT, JSONB);
CREATE OR REPLACE FUNCTION apply_tracker.bulk_import(
    clerk_id_param TEXT,
    apps_json JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_app RECORD;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    FOR v_app IN SELECT * FROM jsonb_to_recordset(apps_json) AS x(
        company_name TEXT,
        role_title TEXT,
        url TEXT,
        status TEXT,
        priority TEXT,
        notes TEXT
    ) LOOP
        INSERT INTO apply_tracker.applications (
            user_id, company_name, role_title, url, status, priority, notes
        ) VALUES (
            v_user_id,
            v_app.company_name,
            v_app.role_title,
            v_app.url,
            COALESCE(v_app.status, 'to_apply'),
            COALESCE(v_app.priority, 'medium'),
            v_app.notes
        );
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for all functions to roles
GRANT ALL ON ALL FUNCTIONS IN SCHEMA apply_tracker TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA apply_tracker GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
