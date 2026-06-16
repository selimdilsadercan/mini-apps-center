-- FUNCTIONS
-- 1. tutor_crm.get_students
-- 2. tutor_crm.add_student
-- 3. tutor_crm.update_student
-- 4. tutor_crm.delete_student
-- 5. tutor_crm.get_lessons
-- 6. tutor_crm.add_lesson
-- 7. tutor_crm.update_lesson
-- 8. tutor_crm.delete_lesson
-- 9. tutor_crm.get_homeworks
-- 10. tutor_crm.add_homework
-- 11. tutor_crm.toggle_homework
-- 12. tutor_crm.get_payments
-- 13. tutor_crm.add_payment
-- 14. tutor_crm.toggle_payment
-- 15. tutor_crm.get_share_settings
-- 16. tutor_crm.toggle_share
-- 17. tutor_crm.get_shared_lessons
-- 18. tutor_crm.follow_share
-- 19. tutor_crm.unfollow_share
-- 20. tutor_crm.get_followed_shares

-- 1. Get Students
DROP FUNCTION IF EXISTS tutor_crm.get_students(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_students(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    subject TEXT,
    level TEXT,
    parent_contact TEXT,
    hourly_rate DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.name,
        s.subject,
        s.level,
        s.parent_contact,
        s.hourly_rate,
        s.created_at
    FROM tutor_crm.students s
    WHERE s.user_id = v_user_id
    ORDER BY s.name ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Add Student
DROP FUNCTION IF EXISTS tutor_crm.add_student(TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL);
CREATE OR REPLACE FUNCTION tutor_crm.add_student(
    p_user_id TEXT,
    p_name TEXT,
    p_subject TEXT,
    p_level TEXT,
    p_parent_contact TEXT,
    p_hourly_rate DECIMAL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    subject TEXT,
    level TEXT,
    parent_contact TEXT,
    hourly_rate DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for p_user_id %', p_user_id;
    END IF;

    RETURN QUERY
    INSERT INTO tutor_crm.students (user_id, name, subject, level, parent_contact, hourly_rate)
    VALUES (v_user_id, p_name, p_subject, p_level, p_parent_contact, p_hourly_rate)
    RETURNING 
        tutor_crm.students.id,
        tutor_crm.students.user_id,
        tutor_crm.students.name,
        tutor_crm.students.subject,
        tutor_crm.students.level,
        tutor_crm.students.parent_contact,
        tutor_crm.students.hourly_rate,
        tutor_crm.students.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Student
DROP FUNCTION IF EXISTS tutor_crm.update_student(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL);
CREATE OR REPLACE FUNCTION tutor_crm.update_student(
    p_student_id UUID,
    p_user_id TEXT,
    p_name TEXT,
    p_subject TEXT,
    p_level TEXT,
    p_parent_contact TEXT,
    p_hourly_rate DECIMAL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    subject TEXT,
    level TEXT,
    parent_contact TEXT,
    hourly_rate DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    UPDATE tutor_crm.students
    SET name = p_name,
        subject = p_subject,
        level = p_level,
        parent_contact = p_parent_contact,
        hourly_rate = p_hourly_rate
    WHERE tutor_crm.students.id = p_student_id AND tutor_crm.students.user_id = v_user_id
    RETURNING 
        tutor_crm.students.id,
        tutor_crm.students.user_id,
        tutor_crm.students.name,
        tutor_crm.students.subject,
        tutor_crm.students.level,
        tutor_crm.students.parent_contact,
        tutor_crm.students.hourly_rate,
        tutor_crm.students.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Delete Student
DROP FUNCTION IF EXISTS tutor_crm.delete_student(UUID, TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.delete_student(p_student_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    DELETE FROM tutor_crm.students WHERE id = p_student_id AND user_id = v_user_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Get Lessons
DROP FUNCTION IF EXISTS tutor_crm.get_lessons(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_lessons(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    student_name TEXT,
    user_id UUID,
    lesson_date DATE,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    next_lesson_plan TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.student_id,
        s.name as student_name,
        l.user_id,
        l.lesson_date,
        l.start_time,
        l.end_time,
        l.notes,
        l.next_lesson_plan,
        l.status,
        l.created_at
    FROM tutor_crm.lessons l
    JOIN tutor_crm.students s ON l.student_id = s.id
    WHERE l.user_id = v_user_id
    ORDER BY l.lesson_date DESC, l.start_time DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6. Add Lesson
DROP FUNCTION IF EXISTS tutor_crm.add_lesson(TEXT, UUID, DATE, TIME, TIME, TEXT, TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.add_lesson(
    p_user_id TEXT,
    p_student_id UUID,
    p_lesson_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_notes TEXT,
    p_next_lesson_plan TEXT
)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    user_id UUID,
    lesson_date DATE,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    next_lesson_plan TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for p_user_id %', p_user_id;
    END IF;

    RETURN QUERY
    INSERT INTO tutor_crm.lessons (user_id, student_id, lesson_date, start_time, end_time, notes, next_lesson_plan)
    VALUES (v_user_id, p_student_id, p_lesson_date, p_start_time, p_end_time, p_notes, p_next_lesson_plan)
    RETURNING 
        tutor_crm.lessons.id,
        tutor_crm.lessons.student_id,
        tutor_crm.lessons.user_id,
        tutor_crm.lessons.lesson_date,
        tutor_crm.lessons.start_time,
        tutor_crm.lessons.end_time,
        tutor_crm.lessons.notes,
        tutor_crm.lessons.next_lesson_plan,
        tutor_crm.lessons.status,
        tutor_crm.lessons.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update Lesson
DROP FUNCTION IF EXISTS tutor_crm.update_lesson(UUID, TEXT, DATE, TIME, TIME);
CREATE OR REPLACE FUNCTION tutor_crm.update_lesson(
    p_lesson_id UUID,
    p_user_id TEXT,
    p_lesson_date DATE,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    user_id UUID,
    lesson_date DATE,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    next_lesson_plan TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    UPDATE tutor_crm.lessons
    SET lesson_date = p_lesson_date,
        start_time = p_start_time,
        end_time = p_end_time
    WHERE tutor_crm.lessons.id = p_lesson_id AND tutor_crm.lessons.user_id = v_user_id
    RETURNING 
        tutor_crm.lessons.id,
        tutor_crm.lessons.student_id,
        tutor_crm.lessons.user_id,
        tutor_crm.lessons.lesson_date,
        tutor_crm.lessons.start_time,
        tutor_crm.lessons.end_time,
        tutor_crm.lessons.notes,
        tutor_crm.lessons.next_lesson_plan,
        tutor_crm.lessons.status,
        tutor_crm.lessons.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Delete Lesson
DROP FUNCTION IF EXISTS tutor_crm.delete_lesson(UUID, TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.delete_lesson(p_lesson_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    DELETE FROM tutor_crm.lessons WHERE id = p_lesson_id AND user_id = v_user_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Get Homeworks
DROP FUNCTION IF EXISTS tutor_crm.get_homeworks(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_homeworks(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    student_name TEXT,
    user_id UUID,
    task TEXT,
    due_date DATE,
    is_completed BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.student_id,
        s.name as student_name,
        h.user_id,
        h.task,
        h.due_date,
        h.is_completed,
        h.created_at
    FROM tutor_crm.homeworks h
    JOIN tutor_crm.students s ON h.student_id = s.id
    WHERE h.user_id = v_user_id
    ORDER BY h.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10. Add Homework
DROP FUNCTION IF EXISTS tutor_crm.add_homework(TEXT, UUID, TEXT, DATE);
CREATE OR REPLACE FUNCTION tutor_crm.add_homework(
    p_user_id TEXT,
    p_student_id UUID,
    p_task TEXT,
    p_due_date DATE
)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    user_id UUID,
    task TEXT,
    due_date DATE,
    is_completed BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for p_user_id %', p_user_id;
    END IF;

    RETURN QUERY
    INSERT INTO tutor_crm.homeworks (user_id, student_id, task, due_date)
    VALUES (v_user_id, p_student_id, p_task, p_due_date)
    RETURNING 
        tutor_crm.homeworks.id,
        tutor_crm.homeworks.student_id,
        tutor_crm.homeworks.user_id,
        tutor_crm.homeworks.task,
        tutor_crm.homeworks.due_date,
        tutor_crm.homeworks.is_completed,
        tutor_crm.homeworks.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Toggle Homework
DROP FUNCTION IF EXISTS tutor_crm.toggle_homework(UUID, TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.toggle_homework(p_homework_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_current_status BOOLEAN;
BEGIN
    SELECT is_completed INTO v_current_status FROM tutor_crm.homeworks WHERE id = p_homework_id AND user_id = v_user_id;
    IF v_current_status IS NULL THEN RETURN FALSE; END IF;
    UPDATE tutor_crm.homeworks SET is_completed = NOT v_current_status WHERE id = p_homework_id AND user_id = v_user_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Get Payments
DROP FUNCTION IF EXISTS tutor_crm.get_payments(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_payments(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    student_name TEXT,
    user_id UUID,
    amount DECIMAL,
    is_paid BOOLEAN,
    payment_date DATE,
    lesson_count INTEGER,
    month INTEGER,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.student_id,
        s.name as student_name,
        p.user_id,
        p.amount,
        p.is_paid,
        p.payment_date,
        p.lesson_count,
        p.month,
        p.year,
        p.created_at
    FROM tutor_crm.payments p
    JOIN tutor_crm.students s ON p.student_id = s.id
    WHERE p.user_id = v_user_id
    ORDER BY p.year DESC, p.month DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 13. Add Payment
DROP FUNCTION IF EXISTS tutor_crm.add_payment(TEXT, UUID, DECIMAL, BOOLEAN, DATE, INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION tutor_crm.add_payment(
    p_user_id TEXT,
    p_student_id UUID,
    p_amount DECIMAL,
    p_is_paid BOOLEAN,
    p_payment_date DATE,
    p_lesson_count INTEGER,
    p_month INTEGER,
    p_year INTEGER
)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    user_id UUID,
    amount DECIMAL,
    is_paid BOOLEAN,
    payment_date DATE,
    lesson_count INTEGER,
    month INTEGER,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for p_user_id %', p_user_id;
    END IF;

    RETURN QUERY
    INSERT INTO tutor_crm.payments (user_id, student_id, amount, is_paid, payment_date, lesson_count, month, year)
    VALUES (v_user_id, p_student_id, p_amount, p_is_paid, p_payment_date, p_lesson_count, p_month, p_year)
    RETURNING 
        tutor_crm.payments.id,
        tutor_crm.payments.student_id,
        tutor_crm.payments.user_id,
        tutor_crm.payments.amount,
        tutor_crm.payments.is_paid,
        tutor_crm.payments.payment_date,
        tutor_crm.payments.lesson_count,
        tutor_crm.payments.month,
        tutor_crm.payments.year,
        tutor_crm.payments.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Toggle Payment
DROP FUNCTION IF EXISTS tutor_crm.toggle_payment(UUID, TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.toggle_payment(p_payment_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_current_status BOOLEAN;
BEGIN
    SELECT is_paid INTO v_current_status FROM tutor_crm.payments WHERE id = p_payment_id AND user_id = v_user_id;
    IF v_current_status IS NULL THEN RETURN FALSE; END IF;
    UPDATE tutor_crm.payments SET is_paid = NOT v_current_status WHERE id = p_payment_id AND user_id = v_user_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Get Share Settings
DROP FUNCTION IF EXISTS tutor_crm.get_share_settings(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_share_settings(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    is_active BOOLEAN,
    allow_student_names BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for p_user_id %', p_user_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tutor_crm.shares sh WHERE sh.user_id = v_user_id) THEN
        INSERT INTO tutor_crm.shares (user_id) VALUES (v_user_id);
    END IF;

    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.is_active,
        s.allow_student_names,
        s.created_at
    FROM tutor_crm.shares s
    WHERE s.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Toggle Share
DROP FUNCTION IF EXISTS tutor_crm.toggle_share(TEXT, BOOLEAN, BOOLEAN);
CREATE OR REPLACE FUNCTION tutor_crm.toggle_share(
    p_user_id TEXT,
    p_is_active BOOLEAN,
    p_allow_student_names BOOLEAN
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    is_active BOOLEAN,
    allow_student_names BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for p_user_id %', p_user_id;
    END IF;

    RETURN QUERY
    INSERT INTO tutor_crm.shares (user_id, is_active, allow_student_names)
    VALUES (v_user_id, p_is_active, p_allow_student_names)
    ON CONFLICT (user_id) DO UPDATE
    SET is_active = p_is_active,
        allow_student_names = p_allow_student_names
    RETURNING 
        tutor_crm.shares.id,
        tutor_crm.shares.user_id,
        tutor_crm.shares.is_active,
        tutor_crm.shares.allow_student_names,
        tutor_crm.shares.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Get Shared Lessons
DROP FUNCTION IF EXISTS tutor_crm.get_shared_lessons(UUID);
CREATE OR REPLACE FUNCTION tutor_crm.get_shared_lessons(p_share_id UUID)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    student_name TEXT,
    user_id UUID,
    lesson_date DATE,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    next_lesson_plan TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_internal_user_id UUID;
    v_is_active BOOLEAN;
    v_allow_student_names BOOLEAN;
BEGIN
    SELECT s.user_id, s.is_active, s.allow_student_names 
    INTO v_internal_user_id, v_is_active, v_allow_student_names 
    FROM tutor_crm.shares s
    WHERE s.id = p_share_id;

    IF v_is_active = TRUE THEN
        RETURN QUERY 
        SELECT 
            l.id, 
            l.student_id, 
            CASE WHEN v_allow_student_names = TRUE THEN st.name ELSE st.subject || ' Dersi' END as student_name, 
            l.user_id, 
            l.lesson_date, 
            l.start_time, 
            l.end_time, 
            CASE WHEN v_allow_student_names = TRUE THEN l.notes ELSE '' END as notes, 
            CASE WHEN v_allow_student_names = TRUE THEN l.next_lesson_plan ELSE '' END as next_lesson_plan, 
            l.status, 
            l.created_at 
        FROM tutor_crm.lessons l 
        JOIN tutor_crm.students st ON l.student_id = st.id 
        WHERE l.user_id = v_internal_user_id 
        ORDER BY l.lesson_date DESC, l.start_time DESC;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 18. Follow Share
DROP FUNCTION IF EXISTS tutor_crm.follow_share(TEXT, UUID, TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.follow_share(
    p_user_id TEXT,
    p_share_id UUID,
    p_alias TEXT
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    share_id UUID,
    alias TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for p_user_id %', p_user_id;
    END IF;

    RETURN QUERY
    INSERT INTO tutor_crm.followed_shares (user_id, share_id, alias)
    VALUES (v_user_id, p_share_id, p_alias)
    ON CONFLICT (user_id, share_id) DO UPDATE
    SET alias = p_alias
    RETURNING 
        tutor_crm.followed_shares.id,
        tutor_crm.followed_shares.user_id,
        tutor_crm.followed_shares.share_id,
        tutor_crm.followed_shares.alias,
        tutor_crm.followed_shares.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Unfollow Share
DROP FUNCTION IF EXISTS tutor_crm.unfollow_share(TEXT, UUID);
CREATE OR REPLACE FUNCTION tutor_crm.unfollow_share(
    p_user_id TEXT,
    p_share_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    DELETE FROM tutor_crm.followed_shares 
    WHERE user_id = v_user_id AND share_id = p_share_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Get Followed Shares
DROP FUNCTION IF EXISTS tutor_crm.get_followed_shares(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_followed_shares(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    share_id UUID,
    alias TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY 
    SELECT 
        f.id, 
        f.user_id, 
        f.share_id, 
        f.alias, 
        f.created_at,
        s.is_active
    FROM tutor_crm.followed_shares f
    JOIN tutor_crm.shares s ON f.share_id = s.id
    WHERE f.user_id = v_user_id
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 21. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tutor_crm TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tutor_crm GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
