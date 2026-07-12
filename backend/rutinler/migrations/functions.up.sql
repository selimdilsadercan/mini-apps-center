-- FUNCTIONS
-- 1. rutinler.get_entries
-- 2. rutinler.add_entry
-- 3. rutinler.delete_entry
-- 4. rutinler.toggle_completion

-- 1. Get Entries
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
    postponed_until TIMESTAMPTZ,
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
        e.postponed_until,
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

-- 2. Add Entry
DROP FUNCTION IF EXISTS rutinler.add_entry(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, SMALLINT, SMALLINT);
CREATE OR REPLACE FUNCTION rutinler.add_entry(
    clerk_id_param TEXT,
    period_type_param TEXT,
    item_name_param TEXT,
    item_emoji_param TEXT,
    item_slug_param TEXT DEFAULT NULL,
    daily_slot_param TEXT DEFAULT NULL,
    day_of_week_param SMALLINT DEFAULT NULL,
    day_of_month_param SMALLINT DEFAULT NULL
)
RETURNS SETOF rutinler.entries AS $$
DECLARE
    v_user_id UUID;
    v_sort_order INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_sort_order
    FROM rutinler.entries
    WHERE user_id = v_user_id AND period_type = period_type_param;

    RETURN QUERY
    INSERT INTO rutinler.entries (
        user_id,
        period_type,
        item_slug,
        item_name,
        item_emoji,
        daily_slot,
        day_of_week,
        day_of_month,
        sort_order
    ) VALUES (
        v_user_id,
        period_type_param,
        item_slug_param,
        item_name_param,
        COALESCE(NULLIF(item_emoji_param, ''), '✨'),
        daily_slot_param,
        day_of_week_param,
        day_of_month_param,
        v_sort_order
    ) RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delete Entry
DROP FUNCTION IF EXISTS rutinler.delete_entry(UUID, TEXT);
CREATE OR REPLACE FUNCTION rutinler.delete_entry(
    entry_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    deleted_count INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    DELETE FROM rutinler.entries
    WHERE id = entry_id_param AND user_id = v_user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Toggle Completion
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

-- 5. Update Entry
DROP FUNCTION IF EXISTS rutinler.update_entry(UUID, TEXT, TEXT, TEXT, TEXT, SMALLINT, SMALLINT);
CREATE OR REPLACE FUNCTION rutinler.update_entry(
    entry_id_param UUID,
    clerk_id_param TEXT,
    item_name_param TEXT,
    item_emoji_param TEXT,
    daily_slot_param TEXT DEFAULT NULL,
    day_of_week_param SMALLINT DEFAULT NULL,
    day_of_month_param SMALLINT DEFAULT NULL
)
RETURNS SETOF rutinler.entries AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    RETURN QUERY
    UPDATE rutinler.entries
    SET 
        item_name = item_name_param,
        item_emoji = item_emoji_param,
        daily_slot = daily_slot_param,
        day_of_week = day_of_week_param,
        day_of_month = day_of_month_param
    WHERE id = entry_id_param AND user_id = v_user_id
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Postpone Entry
DROP FUNCTION IF EXISTS rutinler.postpone_entry(UUID, TEXT);
CREATE OR REPLACE FUNCTION rutinler.postpone_entry(
    entry_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Set postponed_until to tomorrow 00:00:00
    UPDATE rutinler.entries
    SET postponed_until = (current_date + INTERVAL '1 day')
    WHERE id = entry_id_param AND user_id = v_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
