-- 1. Get Entries (Update to include is_next_completed)
DROP FUNCTION IF EXISTS rutinler.get_entries(TEXT);
CREATE OR REPLACE FUNCTION rutinler.get_entries(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    period_type TEXT,
    item_slug TEXT,
    item_name TEXT,
    item_emoji TEXT,
    daily_slot TEXT,
    day_of_week SMALLINT,
    day_of_month SMALLINT,
    sort_order INTEGER,
    created_at TIMESTAMPTZ,
    is_completed BOOLEAN,
    is_next_completed BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
    v_today DATE;
    v_week_start DATE;
    v_month_start DATE;
    v_next_day DATE;
    v_next_week_start DATE;
    v_next_month_start DATE;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    v_today := current_date;
    v_week_start := date_trunc('week', current_date)::date;
    v_month_start := date_trunc('month', current_date)::date;

    v_next_day := v_today + 1;
    v_next_week_start := v_week_start + INTERVAL '1 week';
    v_next_month_start := v_month_start + INTERVAL '1 month';

    RETURN QUERY
    SELECT 
        e.id,
        e.user_id,
        e.period_type,
        e.item_slug,
        e.item_name,
        e.item_emoji,
        e.daily_slot,
        e.day_of_week,
        e.day_of_month,
        e.sort_order,
        e.created_at,
        EXISTS (
            SELECT 1 FROM rutinler.completions c
            WHERE c.entry_id = e.id
            AND (
                (e.period_type = 'daily' AND c.completed_date = v_today) OR
                (e.period_type = 'weekly' AND c.completed_date >= v_week_start AND c.completed_date < v_next_week_start) OR
                (e.period_type = 'monthly' AND c.completed_date >= v_month_start AND c.completed_date < v_next_month_start) OR
                (e.period_type = 'once')
            )
        ) as is_completed,
        EXISTS (
            SELECT 1 FROM rutinler.completions c
            WHERE c.entry_id = e.id
            AND (
                (e.period_type = 'daily' AND c.completed_date = v_next_day) OR
                (e.period_type = 'weekly' AND c.completed_date >= v_next_week_start AND c.completed_date < v_next_week_start + INTERVAL '1 week') OR
                (e.period_type = 'monthly' AND c.completed_date >= v_next_month_start AND c.completed_date < v_next_month_start + INTERVAL '1 month')
            )
        ) as is_next_completed
    FROM rutinler.entries e
    WHERE e.user_id = v_user_id
    ORDER BY e.period_type, e.sort_order, e.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Toggle Completion (Update to include is_next_period_param)
DROP FUNCTION IF EXISTS rutinler.toggle_completion(UUID, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS rutinler.toggle_completion(UUID, TEXT, BOOLEAN, BOOLEAN);
CREATE OR REPLACE FUNCTION rutinler.toggle_completion(
    entry_id_param UUID,
    clerk_id_param TEXT,
    completed_param BOOLEAN,
    is_next_period_param BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_target_date DATE;
    v_today DATE;
    v_week_start DATE;
    v_month_start DATE;
    v_period_type TEXT;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    v_today := current_date;
    v_week_start := date_trunc('week', current_date)::date;
    v_month_start := date_trunc('month', current_date)::date;

    SELECT period_type INTO v_period_type FROM rutinler.entries WHERE id = entry_id_param;

    -- Determine target date based on period and whether it's for next period
    IF v_period_type = 'daily' THEN
        v_target_date := v_today + (CASE WHEN is_next_period_param THEN 1 ELSE 0 END * INTERVAL '1 day');
    ELSIF v_period_type = 'weekly' THEN
        v_target_date := v_week_start + (CASE WHEN is_next_period_param THEN 1 ELSE 0 END * INTERVAL '1 week');
    ELSIF v_period_type = 'monthly' THEN
        v_target_date := v_month_start + (CASE WHEN is_next_period_param THEN 1 ELSE 0 END * INTERVAL '1 month');
    ELSE -- once
        v_target_date := v_today;
    END IF;

    IF completed_param THEN
        INSERT INTO rutinler.completions (entry_id, user_id, completed_date)
        VALUES (entry_id_param, v_user_id, v_target_date)
        ON CONFLICT (entry_id, completed_date) DO NOTHING;
    ELSE
        -- Remove completion for the specific target period
        IF v_period_type = 'daily' THEN
            DELETE FROM rutinler.completions
            WHERE entry_id = entry_id_param 
            AND user_id = v_user_id
            AND completed_date = v_target_date;
        ELSIF v_period_type = 'weekly' THEN
            DELETE FROM rutinler.completions
            WHERE entry_id = entry_id_param 
            AND user_id = v_user_id
            AND completed_date >= v_target_date 
            AND completed_date < v_target_date + INTERVAL '1 week';
        ELSIF v_period_type = 'monthly' THEN
            DELETE FROM rutinler.completions
            WHERE entry_id = entry_id_param 
            AND user_id = v_user_id
            AND completed_date >= v_target_date 
            AND completed_date < v_target_date + INTERVAL '1 month';
        ELSIF v_period_type = 'once' THEN
            DELETE FROM rutinler.completions
            WHERE entry_id = entry_id_param 
            AND user_id = v_user_id;
        END IF;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
