-- 01_init.up.sql
CREATE SCHEMA IF NOT EXISTS tutor_crm;

-- Tables
CREATE TABLE IF NOT EXISTS tutor_crm.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    level TEXT NOT NULL,
    parent_contact TEXT,
    hourly_rate DECIMAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutor_crm.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES tutor_crm.students(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    next_lesson_plan TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutor_crm.homeworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES tutor_crm.students(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    task TEXT NOT NULL,
    due_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutor_crm.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES tutor_crm.students(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    payment_date DATE,
    lesson_count INTEGER DEFAULT 1,
    month INTEGER,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tutor_crm_students_clerk_id ON tutor_crm.students(clerk_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_lessons_student_id ON tutor_crm.lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_lessons_clerk_id ON tutor_crm.lessons(clerk_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_homeworks_student_id ON tutor_crm.homeworks(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_payments_student_id ON tutor_crm.payments(student_id);

-- RPC Functions
DROP FUNCTION IF EXISTS tutor_crm.add_homework(TEXT, UUID, TEXT, DATE);
CREATE OR REPLACE FUNCTION tutor_crm.add_homework(clerk_id_param TEXT, student_id_param UUID, task_param TEXT, due_date_param DATE)
RETURNS SETOF tutor_crm.homeworks AS $$
DECLARE v_new_homework tutor_crm.homeworks;
BEGIN
    INSERT INTO tutor_crm.homeworks (clerk_id, student_id, task, due_date) VALUES (clerk_id_param, student_id_param, task_param, due_date_param) RETURNING * INTO v_new_homework;
    RETURN NEXT v_new_homework;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.add_lesson(TEXT, UUID, DATE, TIME, TIME, TEXT, TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.add_lesson(clerk_id_param TEXT, student_id_param UUID, lesson_date_param DATE, start_time_param TIME, end_time_param TIME, notes_param TEXT, next_lesson_plan_param TEXT)
RETURNS SETOF tutor_crm.lessons AS $$
DECLARE v_new_lesson tutor_crm.lessons;
BEGIN
    INSERT INTO tutor_crm.lessons (clerk_id, student_id, lesson_date, start_time, end_time, notes, next_lesson_plan) VALUES (clerk_id_param, student_id_param, lesson_date_param, start_time_param, end_time_param, notes_param, next_lesson_plan_param) RETURNING * INTO v_new_lesson;
    RETURN NEXT v_new_lesson;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.add_payment(TEXT, UUID, DECIMAL, BOOLEAN, DATE, INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION tutor_crm.add_payment(clerk_id_param TEXT, student_id_param UUID, amount_param DECIMAL, is_paid_param BOOLEAN, payment_date_param DATE, lesson_count_param INTEGER, month_param INTEGER, year_param INTEGER)
RETURNS SETOF tutor_crm.payments AS $$
DECLARE v_new_payment tutor_crm.payments;
BEGIN
    INSERT INTO tutor_crm.payments (clerk_id, student_id, amount, is_paid, payment_date, lesson_count, month, year) VALUES (clerk_id_param, student_id_param, amount_param, is_paid_param, payment_date_param, lesson_count_param, month_param, year_param) RETURNING * INTO v_new_payment;
    RETURN NEXT v_new_payment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.add_student(TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL);
CREATE OR REPLACE FUNCTION tutor_crm.add_student(clerk_id_param TEXT, name_param TEXT, subject_param TEXT, level_param TEXT, parent_contact_param TEXT, hourly_rate_param DECIMAL)
RETURNS SETOF tutor_crm.students AS $$
DECLARE v_new_student tutor_crm.students;
BEGIN
    INSERT INTO tutor_crm.students (clerk_id, name, subject, level, parent_contact, hourly_rate) VALUES (clerk_id_param, name_param, subject_param, level_param, parent_contact_param, hourly_rate_param) RETURNING * INTO v_new_student;
    RETURN NEXT v_new_student;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.delete_lesson(UUID, TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.delete_lesson(lesson_id_param UUID, clerk_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM tutor_crm.lessons WHERE id = lesson_id_param AND clerk_id = clerk_id_param;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.delete_student(UUID, TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.delete_student(student_id_param UUID, clerk_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM tutor_crm.students WHERE id = student_id_param AND clerk_id = clerk_id_param;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.get_homeworks(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_homeworks(clerk_id_param TEXT)
RETURNS TABLE (id UUID, student_id UUID, student_name TEXT, clerk_id TEXT, task TEXT, due_date DATE, is_completed BOOLEAN, created_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY SELECT h.id, h.student_id, s.name as student_name, h.clerk_id, h.task, h.due_date, h.is_completed, h.created_at FROM tutor_crm.homeworks h JOIN tutor_crm.students s ON h.student_id = s.id WHERE h.clerk_id = clerk_id_param ORDER BY h.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.get_lessons(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_lessons(clerk_id_param TEXT)
RETURNS TABLE (id UUID, student_id UUID, student_name TEXT, clerk_id TEXT, lesson_date DATE, start_time TIME, end_time TIME, notes TEXT, next_lesson_plan TEXT, status TEXT, created_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY SELECT l.id, l.student_id, s.name as student_name, l.clerk_id, l.lesson_date, l.start_time, l.end_time, l.notes, l.next_lesson_plan, l.status, l.created_at FROM tutor_crm.lessons l JOIN tutor_crm.students s ON l.student_id = s.id WHERE l.clerk_id = clerk_id_param ORDER BY l.lesson_date DESC, l.start_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.get_payments(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_payments(clerk_id_param TEXT)
RETURNS TABLE (id UUID, student_id UUID, student_name TEXT, clerk_id TEXT, amount DECIMAL, is_paid BOOLEAN, payment_date DATE, lesson_count INTEGER, month INTEGER, year INTEGER, created_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY SELECT p.id, p.student_id, s.name as student_name, p.clerk_id, p.amount, p.is_paid, p.payment_date, p.lesson_count, p.month, p.year, p.created_at FROM tutor_crm.payments p JOIN tutor_crm.students s ON p.student_id = s.id WHERE p.clerk_id = clerk_id_param ORDER BY p.year DESC, p.month DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.get_students(TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.get_students(clerk_id_param TEXT)
RETURNS SETOF tutor_crm.students AS $$
BEGIN
    RETURN QUERY SELECT * FROM tutor_crm.students WHERE clerk_id = clerk_id_param ORDER BY name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.toggle_homework(UUID, TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.toggle_homework(homework_id_param UUID, clerk_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE v_current_status BOOLEAN;
BEGIN
    SELECT is_completed INTO v_current_status FROM tutor_crm.homeworks WHERE id = homework_id_param AND clerk_id = clerk_id_param;
    IF v_current_status IS NULL THEN RETURN FALSE; END IF;
    UPDATE tutor_crm.homeworks SET is_completed = NOT v_current_status WHERE id = homework_id_param AND clerk_id = clerk_id_param;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS tutor_crm.toggle_payment(UUID, TEXT);
CREATE OR REPLACE FUNCTION tutor_crm.toggle_payment(payment_id_param UUID, clerk_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE v_current_status BOOLEAN;
BEGIN
    SELECT is_paid INTO v_current_status FROM tutor_crm.payments WHERE id = payment_id_param AND clerk_id = clerk_id_param;
    IF v_current_status IS NULL THEN RETURN FALSE; END IF;
    UPDATE tutor_crm.payments SET is_paid = NOT v_current_status WHERE id = payment_id_param AND clerk_id = clerk_id_param;
    RETURN TRUE;
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
