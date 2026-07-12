-- 1. Add postponed_until column
ALTER TABLE rutinler.entries ADD COLUMN IF NOT EXISTS postponed_until TIMESTAMPTZ;

-- 2. Update Get Entries function to return postponed_until
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

-- 3. Create Postpone Entry function
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
