-- Haftalık tekrarlayan görev düzeni (şablon) + haftalık tamamlama kaydı

CREATE TABLE IF NOT EXISTS ev_isleri.routine_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES ev_isleri.boards(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    chore_slug TEXT NOT NULL,
    chore_name TEXT NOT NULL,
    chore_icon TEXT,
    assignee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (board_id, day_of_week, chore_slug)
);

CREATE TABLE IF NOT EXISTS ev_isleri.routine_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL REFERENCES ev_isleri.routine_assignments(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    UNIQUE (routine_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_ev_isleri_routine_assignments_board
    ON ev_isleri.routine_assignments(board_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_ev_isleri_routine_completions_week
    ON ev_isleri.routine_completions(week_start);

-- Mevcut haftalık atamaları şablona taşı (en güncel kayıt)
INSERT INTO ev_isleri.routine_assignments (board_id, day_of_week, chore_slug, chore_name, chore_icon, assignee_id)
SELECT DISTINCT ON (a.board_id, a.day_of_week, a.chore_slug)
    a.board_id,
    a.day_of_week,
    a.chore_slug,
    a.chore_name,
    a.chore_icon,
    a.assignee_id
FROM ev_isleri.assignments a
ORDER BY a.board_id, a.day_of_week, a.chore_slug, a.week_start DESC
ON CONFLICT (board_id, day_of_week, chore_slug) DO NOTHING;

INSERT INTO ev_isleri.routine_completions (routine_id, week_start, completed_at, completed_by)
SELECT
    ra.id,
    a.week_start,
    a.completed_at,
    a.completed_by
FROM ev_isleri.assignments a
JOIN ev_isleri.routine_assignments ra
    ON ra.board_id = a.board_id
   AND ra.day_of_week = a.day_of_week
   AND ra.chore_slug = a.chore_slug
WHERE a.completed_at IS NOT NULL
ON CONFLICT (routine_id, week_start) DO NOTHING;

-- get_week_plan artık şablon + seçili haftanın tamamlanma durumunu döner
DROP FUNCTION IF EXISTS ev_isleri.get_week_plan(TEXT, UUID, DATE);
CREATE OR REPLACE FUNCTION ev_isleri.get_week_plan(
    p_clerk_id TEXT,
    p_board_id UUID,
    p_week_start DATE
)
RETURNS TABLE (
    id UUID,
    day_of_week SMALLINT,
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
       AND rc.week_start = p_week_start
    WHERE ra.board_id = p_board_id
    ORDER BY ra.day_of_week ASC, ra.chore_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- set_assignment -> routine şablonuna yazar
DROP FUNCTION IF EXISTS ev_isleri.set_assignment(TEXT, UUID, DATE, SMALLINT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION ev_isleri.set_assignment(
    p_clerk_id TEXT,
    p_board_id UUID,
    p_week_start DATE,
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

    IF p_day_of_week < 1 OR p_day_of_week > 7 THEN
        RAISE EXCEPTION 'day_of_week must be between 1 and 7';
    END IF;

    INSERT INTO ev_isleri.routine_assignments (
        board_id,
        day_of_week,
        chore_slug,
        chore_name,
        chore_icon,
        assignee_id
    ) VALUES (
        p_board_id,
        p_day_of_week,
        p_chore_slug,
        TRIM(p_chore_name),
        NULLIF(TRIM(p_chore_icon), ''),
        v_assignee_id
    )
    ON CONFLICT (board_id, day_of_week, chore_slug)
    DO UPDATE SET
        chore_name = EXCLUDED.chore_name,
        chore_icon = EXCLUDED.chore_icon,
        assignee_id = EXCLUDED.assignee_id
    RETURNING * INTO v_result;

    -- Kişi değiştiyse bu haftanın tamamlanmasını sıfırla
    DELETE FROM ev_isleri.routine_completions rc
    WHERE rc.routine_id = v_result.id
      AND rc.week_start = COALESCE(
        p_week_start,
        (date_trunc('week', CURRENT_DATE)::DATE
          + CASE
              WHEN EXTRACT(ISODOW FROM CURRENT_DATE) = 7 THEN -6
              ELSE 1 - EXTRACT(ISODOW FROM CURRENT_DATE)::INT
            END)
      );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- remove_assignment -> şablondan siler
DROP FUNCTION IF EXISTS ev_isleri.remove_assignment(TEXT, UUID);
CREATE OR REPLACE FUNCTION ev_isleri.remove_assignment(
    p_clerk_id TEXT,
    p_assignment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_board_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT board_id INTO v_board_id
    FROM ev_isleri.routine_assignments
    WHERE id = p_assignment_id;

    IF v_board_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, v_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    DELETE FROM ev_isleri.routine_assignments
    WHERE id = p_assignment_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- toggle -> bu hafta için tamamlama (true = tamamlandı, false = geri alındı)
DROP FUNCTION IF EXISTS ev_isleri.toggle_assignment_complete(TEXT, UUID);
CREATE OR REPLACE FUNCTION ev_isleri.toggle_assignment_complete(
    p_clerk_id TEXT,
    p_assignment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_board_id UUID;
    v_week_start DATE;
    v_existing ev_isleri.routine_completions%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT board_id INTO v_board_id
    FROM ev_isleri.routine_assignments
    WHERE id = p_assignment_id;

    IF v_board_id IS NULL THEN
        RAISE EXCEPTION 'Assignment not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, v_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_week_start := date_trunc('week', CURRENT_DATE)::DATE
        + CASE
            WHEN EXTRACT(ISODOW FROM CURRENT_DATE) = 7 THEN -6
            ELSE 1 - EXTRACT(ISODOW FROM CURRENT_DATE)::INT
          END;

    SELECT * INTO v_existing
    FROM ev_isleri.routine_completions
    WHERE routine_id = p_assignment_id
      AND week_start = v_week_start;

    IF FOUND THEN
        DELETE FROM ev_isleri.routine_completions
        WHERE id = v_existing.id;
        RETURN FALSE;
    END IF;

    INSERT INTO ev_isleri.routine_completions (routine_id, week_start, completed_by)
    VALUES (p_assignment_id, v_week_start, v_user_id);
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT ALL ON TABLE ev_isleri.routine_assignments TO anon, authenticated, service_role;
GRANT ALL ON TABLE ev_isleri.routine_completions TO anon, authenticated, service_role;
