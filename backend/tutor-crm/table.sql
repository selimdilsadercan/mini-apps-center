-- Tutor CRM Schema
CREATE SCHEMA IF NOT EXISTS tutor_crm;

-- Students table
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

-- Lessons table
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

-- Homeworks table
CREATE TABLE IF NOT EXISTS tutor_crm.homeworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES tutor_crm.students(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    task TEXT NOT NULL,
    due_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
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
