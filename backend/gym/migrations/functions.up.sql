-- FUNCTIONS
-- 1. gym.get_routines
-- 2. gym.create_routine
-- 3. gym.delete_routine
-- 4. gym.get_workouts
-- 5. gym.save_workout
-- 6. gym.get_previous_sets
-- 7. gym.get_stats
-- 8. gym.get_weekly_plan
-- 9. gym.set_weekly_plan_day

-- 1. Get Routines
DROP FUNCTION IF EXISTS gym.get_routines(TEXT);
CREATE OR REPLACE FUNCTION gym.get_routines(p_clerk_id TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    exercises JSONB,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
BEGIN
    RETURN QUERY
    SELECT r.id, r.name, r.exercises, r.created_at
    FROM gym.routines r
    WHERE r.user_id = v_user_id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Routine
DROP FUNCTION IF EXISTS gym.create_routine(TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION gym.create_routine(
    p_clerk_id TEXT,
    p_name TEXT,
    p_exercises JSONB DEFAULT '[]'::jsonb
)
RETURNS gym.routines AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_result gym.routines;
BEGIN
    INSERT INTO gym.routines (user_id, name, exercises)
    VALUES (v_user_id, p_name, p_exercises)
    RETURNING * INTO v_result;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delete Routine
DROP FUNCTION IF EXISTS gym.delete_routine(TEXT, UUID);
CREATE OR REPLACE FUNCTION gym.delete_routine(
    p_clerk_id TEXT,
    p_routine_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
BEGIN
    DELETE FROM gym.routines
    WHERE id = p_routine_id AND user_id = v_user_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get Workouts
DROP FUNCTION IF EXISTS gym.get_workouts(TEXT, INTEGER);
CREATE OR REPLACE FUNCTION gym.get_workouts(
    p_clerk_id TEXT,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    routine_id UUID,
    name TEXT,
    exercises JSONB,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    total_volume_kg NUMERIC
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
BEGIN
    RETURN QUERY
    SELECT w.id, w.routine_id, w.name, w.exercises, w.started_at,
           w.finished_at, w.duration_seconds, w.total_volume_kg
    FROM gym.workouts w
    WHERE w.user_id = v_user_id AND w.finished_at IS NOT NULL
    ORDER BY w.finished_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Save Workout
DROP FUNCTION IF EXISTS gym.save_workout(TEXT, TEXT, UUID, JSONB, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, NUMERIC);
CREATE OR REPLACE FUNCTION gym.save_workout(
    p_clerk_id TEXT,
    p_name TEXT,
    p_routine_id UUID,
    p_exercises JSONB,
    p_started_at TIMESTAMPTZ,
    p_finished_at TIMESTAMPTZ,
    p_duration_seconds INTEGER,
    p_total_volume_kg NUMERIC
)
RETURNS gym.workouts AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_result gym.workouts;
BEGIN
    INSERT INTO gym.workouts (
        user_id, routine_id, name, exercises,
        started_at, finished_at, duration_seconds, total_volume_kg
    ) VALUES (
        v_user_id, p_routine_id, p_name, p_exercises,
        p_started_at, p_finished_at, p_duration_seconds, p_total_volume_kg
    ) RETURNING * INTO v_result;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Get Previous Sets for an exercise
DROP FUNCTION IF EXISTS gym.get_previous_sets(TEXT, TEXT);
CREATE OR REPLACE FUNCTION gym.get_previous_sets(
    p_clerk_id TEXT,
    p_exercise_slug TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_exercises JSONB;
    v_exercise JSONB;
    v_set JSONB;
    v_result JSONB := '[]'::jsonb;
BEGIN
    SELECT w.exercises INTO v_exercises
    FROM gym.workouts w
    WHERE w.user_id = v_user_id AND w.finished_at IS NOT NULL
    ORDER BY w.finished_at DESC
    LIMIT 1;

    IF v_exercises IS NULL THEN
        RETURN v_result;
    END IF;

    FOR v_exercise IN SELECT * FROM jsonb_array_elements(v_exercises)
    LOOP
        IF v_exercise->>'slug' = p_exercise_slug THEN
            FOR v_set IN SELECT * FROM jsonb_array_elements(v_exercise->'sets')
            LOOP
                IF (v_set->>'completed')::boolean = true THEN
                    v_result := v_result || jsonb_build_array(v_set);
                END IF;
            END LOOP;
            RETURN v_result;
        END IF;
    END LOOP;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Get Stats (last 3 months weekly data)
DROP FUNCTION IF EXISTS gym.get_stats(TEXT);
CREATE OR REPLACE FUNCTION gym.get_stats(p_clerk_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_week_minutes INTEGER;
    v_total_workouts INTEGER;
    v_result JSONB;
BEGIN
    SELECT COALESCE(SUM(duration_seconds) / 60, 0)::INTEGER INTO v_week_minutes
    FROM gym.workouts
    WHERE user_id = v_user_id
      AND finished_at IS NOT NULL
      AND finished_at >= NOW() - INTERVAL '7 days';

    SELECT COUNT(*)::INTEGER INTO v_total_workouts
    FROM gym.workouts
    WHERE user_id = v_user_id AND finished_at IS NOT NULL;

    v_result := jsonb_build_object(
        'weekMinutes', v_week_minutes,
        'totalWorkouts', v_total_workouts
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Get Weekly Plan (all 7 days with routine details)
DROP FUNCTION IF EXISTS gym.get_weekly_plan(TEXT);
CREATE OR REPLACE FUNCTION gym.get_weekly_plan(p_clerk_id TEXT)
RETURNS TABLE (
    day_of_week SMALLINT,
    routine_id UUID,
    routine_name TEXT,
    exercises JSONB
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
BEGIN
    RETURN QUERY
    SELECT
        days.day_of_week,
        r.id AS routine_id,
        r.name AS routine_name,
        r.exercises
    FROM (
        SELECT generate_series(1, 7)::SMALLINT AS day_of_week
    ) days
    LEFT JOIN gym.weekly_plan wp
        ON wp.user_id = v_user_id AND wp.day_of_week = days.day_of_week
    LEFT JOIN gym.routines r
        ON r.id = wp.routine_id AND r.user_id = v_user_id
    ORDER BY days.day_of_week;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Set routine for a weekday
DROP FUNCTION IF EXISTS gym.set_weekly_plan_day(TEXT, SMALLINT, UUID);
CREATE OR REPLACE FUNCTION gym.set_weekly_plan_day(
    p_clerk_id TEXT,
    p_day_of_week SMALLINT,
    p_routine_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
BEGIN
    IF p_day_of_week < 1 OR p_day_of_week > 7 THEN
        RAISE EXCEPTION 'day_of_week must be between 1 and 7';
    END IF;

    IF p_routine_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM gym.routines
            WHERE id = p_routine_id AND user_id = v_user_id
        ) THEN
            RAISE EXCEPTION 'Routine not found';
        END IF;
    END IF;

    IF p_routine_id IS NULL THEN
        DELETE FROM gym.weekly_plan
        WHERE user_id = v_user_id AND day_of_week = p_day_of_week;
        RETURN TRUE;
    END IF;

    INSERT INTO gym.weekly_plan (user_id, day_of_week, routine_id)
    VALUES (v_user_id, p_day_of_week, p_routine_id)
    ON CONFLICT (user_id, day_of_week)
    DO UPDATE SET
        routine_id = EXCLUDED.routine_id,
        updated_at = NOW();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
