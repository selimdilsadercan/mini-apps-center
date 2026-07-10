--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS gym;

GRANT USAGE ON SCHEMA gym TO anon, authenticated, service_role;

-- Routines
CREATE TABLE IF NOT EXISTS gym.routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workouts (completed sessions)
CREATE TABLE IF NOT EXISTS gym.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    routine_id UUID REFERENCES gym.routines(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    total_volume_kg NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gym_routines_user_id ON gym.routines(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_workouts_user_id ON gym.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_workouts_finished_at ON gym.workouts(finished_at DESC);

-- Weekly plan: assign a routine to each weekday (1=Monday ... 7=Sunday)
CREATE TABLE IF NOT EXISTS gym.weekly_plan (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    routine_id UUID REFERENCES gym.routines(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_gym_weekly_plan_user_id ON gym.weekly_plan(user_id);

GRANT ALL ON ALL TABLES IN SCHEMA gym TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA gym TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA gym GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA gym GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA gym GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
