--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS study;

GRANT USAGE ON SCHEMA study TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS study.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS study.weekly_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES study.students(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    weekly_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_study_self_weekly_plan
    ON study.weekly_plans (owner_user_id, week_start)
    WHERE student_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_study_student_weekly_plan
    ON study.weekly_plans (owner_user_id, student_id, week_start)
    WHERE student_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS study.plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES study.weekly_plans(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
    subject TEXT NOT NULL DEFAULT '',
    item_type TEXT NOT NULL CHECK (item_type IN ('worksheet', 'reading', 'test', 'free')),
    title TEXT NOT NULL,
    target_value NUMERIC,
    target_unit TEXT,
    completed_value NUMERIC NOT NULL DEFAULT 0,
    is_done BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS study.plan_day_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES study.weekly_plans(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
    note TEXT NOT NULL DEFAULT '',
    UNIQUE (plan_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_study_students_owner ON study.students(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_study_weekly_plans_owner ON study.weekly_plans(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_study_weekly_plans_student ON study.weekly_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_items_plan ON study.plan_items(plan_id);

GRANT ALL ON ALL TABLES IN SCHEMA study TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA study TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA study TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
