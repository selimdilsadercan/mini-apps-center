-- Görev tekrarı: günlük, haftalık (gün), aylık (ayın günü)

ALTER TABLE ev_isleri.routine_assignments
    ADD COLUMN IF NOT EXISTS recurrence_type TEXT NOT NULL DEFAULT 'weekly';

ALTER TABLE ev_isleri.routine_assignments
    DROP CONSTRAINT IF EXISTS routine_assignments_recurrence_type_check;

ALTER TABLE ev_isleri.routine_assignments
    ADD CONSTRAINT routine_assignments_recurrence_type_check
    CHECK (recurrence_type IN ('daily', 'weekly', 'monthly'));

UPDATE ev_isleri.routine_assignments
SET recurrence_type = 'weekly'
WHERE recurrence_type IS NULL;

ALTER TABLE ev_isleri.routine_completions
    RENAME COLUMN week_start TO period_start;

ALTER TABLE ev_isleri.routine_assignments
    DROP CONSTRAINT IF EXISTS routine_assignments_board_id_day_of_week_chore_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_routine_assignments_board_recurrence
    ON ev_isleri.routine_assignments (board_id, chore_slug, recurrence_type, day_of_week);

CREATE OR REPLACE FUNCTION ev_isleri.routine_period_start(
    p_recurrence_type TEXT,
    p_reference DATE DEFAULT CURRENT_DATE
)
RETURNS DATE AS $$
BEGIN
    RETURN CASE p_recurrence_type
        WHEN 'daily' THEN p_reference
        WHEN 'weekly' THEN (
            p_reference
            + CASE
                WHEN EXTRACT(ISODOW FROM p_reference) = 7 THEN -6
                ELSE 1 - EXTRACT(ISODOW FROM p_reference)::INT
              END
        )
        WHEN 'monthly' THEN date_trunc('month', p_reference)::DATE
        ELSE p_reference
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS ev_isleri.get_week_plan(TEXT, UUID, DATE);
CREATE OR REPLACE FUNCTION ev_isleri.get_week_plan(
    p_clerk_id TEXT,
    p_board_id UUID,
    p_week_start DATE
)
RETURNS TABLE (
    id UUID,
    day_of_week SMALLINT,
    recurrence_type TEXT,
    chore_slug TEXT,
    chore_name TEXT,
    chore_icon TEXT,
    assignee_id UUID,
    assignee_clerk_id TEXT,
    assignee_username TEXT,
    assignee_avatar_url TEXT,
    completed_at TIMESTAMPTZ,
    completed_by UUID
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, p_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        ra.id,
        ra.day_of_week,
        ra.recurrence_type,
        ra.chore_slug,
        ra.chore_name,
        ra.chore_icon,
        ra.assignee_id,
        u.clerk_id::TEXT AS assignee_clerk_id,
        u.username::TEXT AS assignee_username,
        u.avatar_url::TEXT AS assignee_avatar_url,
        rc.completed_at,
        rc.completed_by
    FROM ev_isleri.routine_assignments ra
    JOIN public.users u ON u.id = ra.assignee_id
    LEFT JOIN ev_isleri.routine_completions rc
        ON rc.routine_id = ra.id
       AND rc.period_start = ev_isleri.routine_period_start(ra.recurrence_type, CURRENT_DATE)
    WHERE ra.board_id = p_board_id
    ORDER BY
        CASE ra.recurrence_type
            WHEN 'daily' THEN 1
            WHEN 'weekly' THEN 2
            WHEN 'monthly' THEN 3
            ELSE 4
        END,
        ra.day_of_week ASC,
        ra.chore_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS ev_isleri.set_assignment(TEXT, UUID, DATE, SMALLINT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS ev_isleri.set_assignment(TEXT, UUID, DATE, TEXT, SMALLINT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION ev_isleri.set_assignment(
    p_clerk_id TEXT,
    p_board_id UUID,
    p_week_start DATE,
    p_recurrence_type TEXT,
    p_day_of_week SMALLINT,
    p_chore_slug TEXT,
    p_chore_name TEXT,
    p_chore_icon TEXT,
    p_assignee_clerk_id TEXT
)
RETURNS ev_isleri.routine_assignments AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_assignee_id UUID := public.get_internal_user_id(p_assignee_clerk_id);
    v_result ev_isleri.routine_assignments;
    v_period_start DATE;
BEGIN
    IF v_user_id IS NULL OR v_assignee_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, p_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_assignee_id, p_board_id) THEN
        RAISE EXCEPTION 'Assignee is not a board member';
    END IF;

    IF p_recurrence_type NOT IN ('daily', 'weekly', 'monthly') THEN
        RAISE EXCEPTION 'Invalid recurrence_type';
    END IF;

    IF p_recurrence_type = 'daily' AND p_day_of_week <> 0 THEN
        RAISE EXCEPTION 'daily tasks must use day_of_week 0';
    END IF;

    IF p_recurrence_type = 'weekly' AND (p_day_of_week < 1 OR p_day_of_week > 7) THEN
        RAISE EXCEPTION 'weekly day_of_week must be between 1 and 7';
    END IF;

    IF p_recurrence_type = 'monthly' AND (p_day_of_week < 1 OR p_day_of_week > 31) THEN
        RAISE EXCEPTION 'monthly day_of_week must be between 1 and 31';
    END IF;

    INSERT INTO ev_isleri.routine_assignments (
        board_id,
        day_of_week,
        recurrence_type,
        chore_slug,
        chore_name,
        chore_icon,
        assignee_id
    ) VALUES (
        p_board_id,
        p_day_of_week,
        p_recurrence_type,
        p_chore_slug,
        TRIM(p_chore_name),
        NULLIF(TRIM(p_chore_icon), ''),
        v_assignee_id
    )
    ON CONFLICT (board_id, chore_slug, recurrence_type, day_of_week)
    DO UPDATE SET
        chore_name = EXCLUDED.chore_name,
        chore_icon = EXCLUDED.chore_icon,
        assignee_id = EXCLUDED.assignee_id
    RETURNING * INTO v_result;

    v_period_start := ev_isleri.routine_period_start(v_result.recurrence_type, CURRENT_DATE);

    DELETE FROM ev_isleri.routine_completions rc
    WHERE rc.routine_id = v_result.id
      AND rc.period_start = v_period_start;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS ev_isleri.toggle_assignment_complete(TEXT, UUID);
CREATE OR REPLACE FUNCTION ev_isleri.toggle_assignment_complete(
    p_clerk_id TEXT,
    p_assignment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_board_id UUID;
    v_recurrence_type TEXT;
    v_period_start DATE;
    v_existing ev_isleri.routine_completions%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT board_id, recurrence_type
    INTO v_board_id, v_recurrence_type
    FROM ev_isleri.routine_assignments
    WHERE id = p_assignment_id;

    IF v_board_id IS NULL THEN
        RAISE EXCEPTION 'Assignment not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, v_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_period_start := ev_isleri.routine_period_start(v_recurrence_type, CURRENT_DATE);

    SELECT * INTO v_existing
    FROM ev_isleri.routine_completions
    WHERE routine_id = p_assignment_id
      AND period_start = v_period_start;

    IF FOUND THEN
        DELETE FROM ev_isleri.routine_completions
        WHERE id = v_existing.id;
        RETURN FALSE;
    END IF;

    INSERT INTO ev_isleri.routine_completions (routine_id, period_start, completed_by)
    VALUES (p_assignment_id, v_period_start, v_user_id);
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
