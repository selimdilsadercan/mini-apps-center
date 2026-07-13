-- FUNCTIONS
-- 1. study.get_students
-- 2. study.add_student
-- 3. study.delete_student
-- 4. study.get_weekly_plan
-- 5. study.set_weekly_notes
-- 6. study.set_day_note
-- 7. study.add_plan_item
-- 8. study.update_plan_item
-- 9. study.delete_plan_item

-- 1. Get Students
DROP FUNCTION IF EXISTS study.get_students(TEXT);
CREATE OR REPLACE FUNCTION study.get_students(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    grade TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_user_id);
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT s.id, s.name, s.grade, s.created_at
    FROM study.students s
    WHERE s.owner_user_id = v_user_id
    ORDER BY s.name ASC, s.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Student
DROP FUNCTION IF EXISTS study.add_student(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION study.add_student(
    p_user_id TEXT,
    p_name TEXT,
    p_grade TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    grade TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_user_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    RETURN QUERY
    INSERT INTO study.students (owner_user_id, name, grade)
    VALUES (v_user_id, TRIM(p_name), NULLIF(TRIM(p_grade), ''))
    RETURNING study.students.id, study.students.name, study.students.grade, study.students.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delete Student
DROP FUNCTION IF EXISTS study.delete_student(UUID, TEXT);
CREATE OR REPLACE FUNCTION study.delete_student(
    p_student_id UUID,
    p_user_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_user_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    DELETE FROM study.students
    WHERE id = p_student_id AND owner_user_id = v_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: get or create plan
DROP FUNCTION IF EXISTS study.ensure_weekly_plan(UUID, DATE, UUID);
CREATE OR REPLACE FUNCTION study.ensure_weekly_plan(
    p_user_id UUID,
    p_week_start DATE,
    p_student_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_plan_id UUID;
BEGIN
    SELECT wp.id INTO v_plan_id
    FROM study.weekly_plans wp
    WHERE wp.owner_user_id = p_user_id
      AND wp.week_start = p_week_start
      AND (
        (p_student_id IS NULL AND wp.student_id IS NULL)
        OR wp.student_id = p_student_id
      )
    LIMIT 1;

    IF v_plan_id IS NOT NULL THEN
        RETURN v_plan_id;
    END IF;

    INSERT INTO study.weekly_plans (owner_user_id, student_id, week_start)
    VALUES (p_user_id, p_student_id, p_week_start)
    RETURNING id INTO v_plan_id;

    RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get Weekly Plan
DROP FUNCTION IF EXISTS study.get_weekly_plan(TEXT, DATE, UUID);
CREATE OR REPLACE FUNCTION study.get_weekly_plan(
    p_user_id TEXT,
    p_week_start DATE,
    p_student_id UUID DEFAULT NULL
)
RETURNS TABLE (
    plan_id UUID,
    week_start DATE,
    weekly_notes TEXT,
    student_id UUID,
    student_name TEXT,
    item_id UUID,
    day_of_week SMALLINT,
    subject TEXT,
    item_type TEXT,
    title TEXT,
    target_value NUMERIC,
    target_unit TEXT,
    completed_value NUMERIC,
    is_done BOOLEAN,
    sort_order INTEGER,
    day_note TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_plan_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_user_id);
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    IF p_student_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM study.students s
            WHERE s.id = p_student_id AND s.owner_user_id = v_user_id
        ) THEN
            RETURN;
        END IF;
    END IF;

    v_plan_id := study.ensure_weekly_plan(v_user_id, p_week_start, p_student_id);

    IF NOT EXISTS (SELECT 1 FROM study.plan_items pi WHERE pi.plan_id = v_plan_id) THEN
        RETURN QUERY
        SELECT
            wp.id AS plan_id,
            wp.week_start,
            wp.weekly_notes,
            wp.student_id,
            st.name AS student_name,
            NULL::UUID AS item_id,
            NULL::SMALLINT AS day_of_week,
            NULL::TEXT AS subject,
            NULL::TEXT AS item_type,
            NULL::TEXT AS title,
            NULL::NUMERIC AS target_value,
            NULL::TEXT AS target_unit,
            NULL::NUMERIC AS completed_value,
            NULL::BOOLEAN AS is_done,
            NULL::INTEGER AS sort_order,
            NULL::TEXT AS day_note
        FROM study.weekly_plans wp
        LEFT JOIN study.students st ON st.id = wp.student_id
        WHERE wp.id = v_plan_id;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        wp.id AS plan_id,
        wp.week_start,
        wp.weekly_notes,
        wp.student_id,
        st.name AS student_name,
        pi.id AS item_id,
        pi.day_of_week,
        pi.subject,
        pi.item_type,
        pi.title,
        pi.target_value,
        pi.target_unit,
        pi.completed_value,
        pi.is_done,
        pi.sort_order,
        pdn.note AS day_note
    FROM study.weekly_plans wp
    LEFT JOIN study.students st ON st.id = wp.student_id
    LEFT JOIN study.plan_items pi ON pi.plan_id = wp.id
    LEFT JOIN study.plan_day_notes pdn
        ON pdn.plan_id = wp.id AND pdn.day_of_week = pi.day_of_week
    WHERE wp.id = v_plan_id
    ORDER BY pi.day_of_week NULLS LAST, pi.sort_order, pi.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Set Weekly Notes
DROP FUNCTION IF EXISTS study.set_weekly_notes(TEXT, DATE, UUID, TEXT);
CREATE OR REPLACE FUNCTION study.set_weekly_notes(
    p_user_id TEXT,
    p_week_start DATE,
    p_student_id UUID,
    p_notes TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_plan_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_user_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    v_plan_id := study.ensure_weekly_plan(v_user_id, p_week_start, p_student_id);

    UPDATE study.weekly_plans
    SET weekly_notes = p_notes
    WHERE id = v_plan_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Set Day Note
DROP FUNCTION IF EXISTS study.set_day_note(TEXT, DATE, UUID, SMALLINT, TEXT);
CREATE OR REPLACE FUNCTION study.set_day_note(
    p_user_id TEXT,
    p_week_start DATE,
    p_student_id UUID,
    p_day_of_week SMALLINT,
    p_note TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_plan_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_user_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    v_plan_id := study.ensure_weekly_plan(v_user_id, p_week_start, p_student_id);

    INSERT INTO study.plan_day_notes (plan_id, day_of_week, note)
    VALUES (v_plan_id, p_day_of_week, p_note)
    ON CONFLICT (plan_id, day_of_week)
    DO UPDATE SET note = EXCLUDED.note;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add Plan Item
DROP FUNCTION IF EXISTS study.add_plan_item(TEXT, DATE, UUID, SMALLINT, TEXT, TEXT, TEXT, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION study.add_plan_item(
    p_user_id TEXT,
    p_week_start DATE,
    p_student_id UUID,
    p_day_of_week SMALLINT,
    p_subject TEXT,
    p_item_type TEXT,
    p_title TEXT,
    p_target_value NUMERIC DEFAULT NULL,
    p_target_unit TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    plan_id UUID,
    day_of_week SMALLINT,
    subject TEXT,
    item_type TEXT,
    title TEXT,
    target_value NUMERIC,
    target_unit TEXT,
    completed_value NUMERIC,
    is_done BOOLEAN,
    sort_order INTEGER
) AS $$
DECLARE
    v_user_id UUID;
    v_plan_id UUID;
    v_sort_order INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(p_user_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    v_plan_id := study.ensure_weekly_plan(v_user_id, p_week_start, p_student_id);

    SELECT COALESCE(MAX(pi.sort_order), 0) + 1 INTO v_sort_order
    FROM study.plan_items pi
    WHERE pi.plan_id = v_plan_id AND pi.day_of_week = p_day_of_week;

    RETURN QUERY
    INSERT INTO study.plan_items (
        plan_id, day_of_week, subject, item_type, title, target_value, target_unit, sort_order
    )
    VALUES (
        v_plan_id,
        p_day_of_week,
        COALESCE(NULLIF(TRIM(p_subject), ''), 'Genel'),
        p_item_type,
        TRIM(p_title),
        p_target_value,
        NULLIF(TRIM(p_target_unit), ''),
        v_sort_order
    )
    RETURNING
        study.plan_items.id,
        study.plan_items.plan_id,
        study.plan_items.day_of_week,
        study.plan_items.subject,
        study.plan_items.item_type,
        study.plan_items.title,
        study.plan_items.target_value,
        study.plan_items.target_unit,
        study.plan_items.completed_value,
        study.plan_items.is_done,
        study.plan_items.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update Plan Item
DROP FUNCTION IF EXISTS study.update_plan_item(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, NUMERIC, BOOLEAN);
CREATE OR REPLACE FUNCTION study.update_plan_item(
    p_item_id UUID,
    p_user_id TEXT,
    p_subject TEXT DEFAULT NULL,
    p_item_type TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_target_value NUMERIC DEFAULT NULL,
    p_target_unit TEXT DEFAULT NULL,
    p_completed_value NUMERIC DEFAULT NULL,
    p_is_done BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_user_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE study.plan_items pi
    SET
        subject = COALESCE(NULLIF(TRIM(p_subject), ''), pi.subject),
        item_type = COALESCE(p_item_type, pi.item_type),
        title = COALESCE(NULLIF(TRIM(p_title), ''), pi.title),
        target_value = COALESCE(p_target_value, pi.target_value),
        target_unit = COALESCE(NULLIF(TRIM(p_target_unit), ''), pi.target_unit),
        completed_value = COALESCE(p_completed_value, pi.completed_value),
        is_done = COALESCE(p_is_done, pi.is_done)
    FROM study.weekly_plans wp
    WHERE pi.id = p_item_id
      AND pi.plan_id = wp.id
      AND wp.owner_user_id = v_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Delete Plan Item
DROP FUNCTION IF EXISTS study.delete_plan_item(UUID, TEXT);
CREATE OR REPLACE FUNCTION study.delete_plan_item(
    p_item_id UUID,
    p_user_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_user_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    DELETE FROM study.plan_items pi
    USING study.weekly_plans wp
    WHERE pi.id = p_item_id
      AND pi.plan_id = wp.id
      AND wp.owner_user_id = v_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
