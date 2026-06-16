--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (clerk_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    -- Students
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'tutor_crm' AND table_name = 'students' AND column_name = 'clerk_id' AND data_type = 'text') THEN
        ALTER TABLE tutor_crm.students RENAME COLUMN clerk_id TO clerk_id_old;
        ALTER TABLE tutor_crm.students ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        UPDATE tutor_crm.students s SET user_id = u.id FROM public.users u WHERE s.clerk_id_old = u.clerk_id OR s.clerk_id_old = u.local_clerk_id;
        DELETE FROM tutor_crm.students WHERE user_id IS NULL;
        ALTER TABLE tutor_crm.students ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE tutor_crm.students DROP COLUMN clerk_id_old;
        CREATE INDEX IF NOT EXISTS idx_tutor_crm_students_user_id ON tutor_crm.students(user_id);
    END IF;

    -- Lessons
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'tutor_crm' AND table_name = 'lessons' AND column_name = 'clerk_id' AND data_type = 'text') THEN
        ALTER TABLE tutor_crm.lessons RENAME COLUMN clerk_id TO clerk_id_old;
        ALTER TABLE tutor_crm.lessons ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        UPDATE tutor_crm.lessons l SET user_id = u.id FROM public.users u WHERE l.clerk_id_old = u.clerk_id OR l.clerk_id_old = u.local_clerk_id;
        DELETE FROM tutor_crm.lessons WHERE user_id IS NULL;
        ALTER TABLE tutor_crm.lessons ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE tutor_crm.lessons DROP COLUMN clerk_id_old;
        CREATE INDEX IF NOT EXISTS idx_tutor_crm_lessons_user_id ON tutor_crm.lessons(user_id);
    END IF;

    -- Homeworks
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'tutor_crm' AND table_name = 'homeworks' AND column_name = 'clerk_id' AND data_type = 'text') THEN
        ALTER TABLE tutor_crm.homeworks RENAME COLUMN clerk_id TO clerk_id_old;
        ALTER TABLE tutor_crm.homeworks ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        UPDATE tutor_crm.homeworks h SET user_id = u.id FROM public.users u WHERE h.clerk_id_old = u.clerk_id OR h.clerk_id_old = u.local_clerk_id;
        DELETE FROM tutor_crm.homeworks WHERE user_id IS NULL;
        ALTER TABLE tutor_crm.homeworks ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE tutor_crm.homeworks DROP COLUMN clerk_id_old;
        CREATE INDEX IF NOT EXISTS idx_tutor_crm_homeworks_user_id ON tutor_crm.homeworks(user_id);
    END IF;

    -- Payments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'tutor_crm' AND table_name = 'payments' AND column_name = 'clerk_id' AND data_type = 'text') THEN
        ALTER TABLE tutor_crm.payments RENAME COLUMN clerk_id TO clerk_id_old;
        ALTER TABLE tutor_crm.payments ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        UPDATE tutor_crm.payments p SET user_id = u.id FROM public.users u WHERE p.clerk_id_old = u.clerk_id OR p.clerk_id_old = u.local_clerk_id;
        DELETE FROM tutor_crm.payments WHERE user_id IS NULL;
        ALTER TABLE tutor_crm.payments ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE tutor_crm.payments DROP COLUMN clerk_id_old;
        CREATE INDEX IF NOT EXISTS idx_tutor_crm_payments_user_id ON tutor_crm.payments(user_id);
    END IF;

    -- Shares
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'tutor_crm' AND table_name = 'shares' AND column_name = 'clerk_id' AND data_type = 'text') THEN
        ALTER TABLE tutor_crm.shares RENAME COLUMN clerk_id TO clerk_id_old;
        ALTER TABLE tutor_crm.shares ADD COLUMN user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE;
        UPDATE tutor_crm.shares s SET user_id = u.id FROM public.users u WHERE s.clerk_id_old = u.clerk_id OR s.clerk_id_old = u.local_clerk_id;
        DELETE FROM tutor_crm.shares WHERE user_id IS NULL;
        ALTER TABLE tutor_crm.shares ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE tutor_crm.shares DROP COLUMN clerk_id_old;
        CREATE INDEX IF NOT EXISTS idx_tutor_crm_shares_user_id ON tutor_crm.shares(user_id);
    END IF;

    -- Followed Shares
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'tutor_crm' AND table_name = 'followed_shares' AND column_name = 'clerk_id' AND data_type = 'text') THEN
        ALTER TABLE tutor_crm.followed_shares RENAME COLUMN clerk_id TO clerk_id_old;
        ALTER TABLE tutor_crm.followed_shares ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        UPDATE tutor_crm.followed_shares f SET user_id = u.id FROM public.users u WHERE f.clerk_id_old = u.clerk_id OR f.clerk_id_old = u.local_clerk_id;
        DELETE FROM tutor_crm.followed_shares WHERE user_id IS NULL;
        ALTER TABLE tutor_crm.followed_shares ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE tutor_crm.followed_shares DROP COLUMN clerk_id_old;
        ALTER TABLE tutor_crm.followed_shares ADD CONSTRAINT unique_user_share UNIQUE(user_id, share_id);
        CREATE INDEX IF NOT EXISTS idx_tutor_crm_followed_shares_user_id ON tutor_crm.followed_shares(user_id);
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS tutor_crm;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA tutor_crm TO anon, authenticated, service_role;

-- 2. Students Table
CREATE TABLE IF NOT EXISTS tutor_crm.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    level TEXT NOT NULL,
    parent_contact TEXT,
    hourly_rate DECIMAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Lessons Table
CREATE TABLE IF NOT EXISTS tutor_crm.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES tutor_crm.students(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    next_lesson_plan TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Homeworks Table
CREATE TABLE IF NOT EXISTS tutor_crm.homeworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES tutor_crm.students(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    due_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Payments Table
CREATE TABLE IF NOT EXISTS tutor_crm.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES tutor_crm.students(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    payment_date DATE,
    lesson_count INTEGER DEFAULT 1,
    month INTEGER,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Shares Table
CREATE TABLE IF NOT EXISTS tutor_crm.shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    allow_student_names BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Followed Shares Table
CREATE TABLE IF NOT EXISTS tutor_crm.followed_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    share_id UUID NOT NULL REFERENCES tutor_crm.shares(id) ON DELETE CASCADE,
    alias TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, share_id)
);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_tutor_crm_students_user_id ON tutor_crm.students(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_lessons_user_id ON tutor_crm.lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_lessons_student_id ON tutor_crm.lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_homeworks_user_id ON tutor_crm.homeworks(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_homeworks_student_id ON tutor_crm.homeworks(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_payments_user_id ON tutor_crm.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_payments_student_id ON tutor_crm.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_shares_user_id ON tutor_crm.shares(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_followed_shares_user_id ON tutor_crm.followed_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_crm_followed_shares_share_id ON tutor_crm.followed_shares(share_id);

-- 9. Grants
GRANT ALL ON ALL TABLES IN SCHEMA tutor_crm TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tutor_crm TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA tutor_crm GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tutor_crm GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tutor_crm GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
