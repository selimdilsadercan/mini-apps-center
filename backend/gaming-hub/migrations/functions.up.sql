-- =============================================================================
-- FUNCTIONS INDEX
-- =============================================================================
-- 1. gaming_hub.upsert_library_item(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT)
-- 2. gaming_hub.get_user_library(TEXT)
-- 3. gaming_hub.add_price_alert(TEXT, TEXT, TEXT, NUMERIC)
-- 4. gaming_hub.get_price_alerts(TEXT)
-- 5. gaming_hub.log_play_session(TEXT, TEXT, INTEGER)
-- 6. gaming_hub.upsert_habit_limits(TEXT, INTEGER, INTEGER)
-- 7. gaming_hub.get_play_stats(TEXT)
-- 8. gaming_hub.delete_library_item(TEXT, UUID)
-- 9. gaming_hub.get_daily_task(TEXT)
-- 10. gaming_hub.set_daily_task(TEXT, TEXT, TEXT, TEXT, INTEGER)
-- 11. gaming_hub.complete_daily_task(TEXT)

-- 1. UPSERT LIBRARY ITEM
DROP FUNCTION IF EXISTS gaming_hub.upsert_library_item(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS gaming_hub.upsert_library_item(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION gaming_hub.upsert_library_item(
  p_clerk_id   TEXT,
  p_game_name  TEXT,
  p_platform   TEXT,
  p_status     TEXT,
  p_play_time  INTEGER DEFAULT 0,
  p_rating     INTEGER DEFAULT NULL,
  p_notes      TEXT DEFAULT NULL,
  p_game_mode  TEXT DEFAULT 'single',
  p_igdb_id    TEXT DEFAULT NULL,
  p_cover_url  TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_item_id UUID;
BEGIN
  v_user_id := public.get_internal_user_id(p_clerk_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for clerk_id: %', p_clerk_id;
  END IF;

  INSERT INTO gaming_hub.library (user_id, game_name, platform, status, play_time, rating, notes, game_mode, igdb_id, cover_url, updated_at)
  VALUES (v_user_id, p_game_name, p_platform, p_status, p_play_time, p_rating, p_notes, p_game_mode, p_igdb_id, p_cover_url, now())
  ON CONFLICT (user_id, game_name, platform, game_mode)
  DO UPDATE SET
    status = EXCLUDED.status,
    play_time = EXCLUDED.play_time,
    rating = COALESCE(EXCLUDED.rating, gaming_hub.library.rating),
    notes = COALESCE(EXCLUDED.notes, gaming_hub.library.notes),
    igdb_id = COALESCE(EXCLUDED.igdb_id, gaming_hub.library.igdb_id),
    cover_url = COALESCE(EXCLUDED.cover_url, gaming_hub.library.cover_url),
    updated_at = now()
  RETURNING id INTO v_item_id;

  RETURN v_item_id;
END;
$$;

-- 2. GET USER LIBRARY
DROP FUNCTION IF EXISTS gaming_hub.get_user_library(TEXT);
CREATE OR REPLACE FUNCTION gaming_hub.get_user_library(p_clerk_id TEXT)
RETURNS TABLE (
  id          UUID,
  game_name   TEXT,
  platform    TEXT,
  status      TEXT,
  play_time   INTEGER,
  rating      INTEGER,
  notes       TEXT,
  game_mode   TEXT,
  igdb_id     TEXT,
  cover_url   TEXT,
  updated_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := public.get_internal_user_id(p_clerk_id);
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT l.id, l.game_name, l.platform, l.status, l.play_time, l.rating, l.notes,
         l.game_mode, l.igdb_id, l.cover_url, l.updated_at
  FROM gaming_hub.library l
  WHERE l.user_id = v_user_id
  ORDER BY l.updated_at DESC;
END;
$$;

-- 3. ADD PRICE ALERT
DROP FUNCTION IF EXISTS gaming_hub.add_price_alert(TEXT, TEXT, TEXT, NUMERIC);
CREATE OR REPLACE FUNCTION gaming_hub.add_price_alert(
  p_clerk_id     TEXT,
  p_game_name    TEXT,
  p_platform     TEXT,
  p_target_price NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id  UUID;
  v_alert_id UUID;
BEGIN
  v_user_id := public.get_internal_user_id(p_clerk_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO gaming_hub.price_alerts (user_id, game_name, platform, target_price)
  VALUES (v_user_id, p_game_name, p_platform, p_target_price)
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$;

-- 4. GET PRICE ALERTS
DROP FUNCTION IF EXISTS gaming_hub.get_price_alerts(TEXT);
CREATE OR REPLACE FUNCTION gaming_hub.get_price_alerts(p_clerk_id TEXT)
RETURNS TABLE (
  id            UUID,
  game_name     TEXT,
  platform      TEXT,
  target_price  NUMERIC(10, 2),
  current_price NUMERIC(10, 2),
  is_triggered  BOOLEAN,
  created_at    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := public.get_internal_user_id(p_clerk_id);
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT a.id, a.game_name, a.platform, a.target_price, a.current_price, a.is_triggered, a.created_at
  FROM gaming_hub.price_alerts a
  WHERE a.user_id = v_user_id
  ORDER BY a.created_at DESC;
END;
$$;

-- 5. LOG PLAY SESSION
DROP FUNCTION IF EXISTS gaming_hub.log_play_session(TEXT, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION gaming_hub.log_play_session(
  p_clerk_id   TEXT,
  p_game_name  TEXT,
  p_duration   INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id   UUID;
  v_log_id    UUID;
  v_platform  TEXT;
BEGIN
  v_user_id := public.get_internal_user_id(p_clerk_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Insert into raw play log
  INSERT INTO gaming_hub.play_logs (user_id, game_name, duration)
  VALUES (v_user_id, p_game_name, p_duration)
  RETURNING id INTO v_log_id;

  -- Also automatically update overall play time in library if game exists (grab first match platform)
  SELECT platform INTO v_platform
  FROM gaming_hub.library
  WHERE user_id = v_user_id AND game_name = p_game_name
  LIMIT 1;

  IF v_platform IS NOT NULL THEN
    UPDATE gaming_hub.library
    SET play_time = play_time + p_duration, updated_at = now()
    WHERE user_id = v_user_id AND game_name = p_game_name AND platform = v_platform;
  ELSE
    -- If it doesn't exist, we upsert to library under "playing" status with default PC platform
    INSERT INTO gaming_hub.library (user_id, game_name, platform, status, play_time, game_mode)
    VALUES (v_user_id, p_game_name, 'PC', 'playing', p_duration, 'single')
    ON CONFLICT (user_id, game_name, platform, game_mode)
    DO UPDATE SET play_time = gaming_hub.library.play_time + p_duration, updated_at = now();
  END IF;

  RETURN v_log_id;
END;
$$;

-- 6. UPSERT HABIT LIMITS
DROP FUNCTION IF EXISTS gaming_hub.upsert_habit_limits(TEXT, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION gaming_hub.upsert_habit_limits(
  p_clerk_id     TEXT,
  p_daily_limit  INTEGER,
  p_weekly_limit INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id  UUID;
  v_habit_id UUID;
BEGIN
  v_user_id := public.get_internal_user_id(p_clerk_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO gaming_hub.habits (user_id, daily_limit, weekly_limit, updated_at)
  VALUES (v_user_id, p_daily_limit, p_weekly_limit, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    daily_limit = EXCLUDED.daily_limit,
    weekly_limit = EXCLUDED.weekly_limit,
    updated_at = now()
  RETURNING id INTO v_habit_id;

  RETURN v_habit_id;
END;
$$;

-- 7. GET PLAY STATS & HABIT LIMITS
DROP FUNCTION IF EXISTS gaming_hub.get_play_stats(TEXT);
CREATE OR REPLACE FUNCTION gaming_hub.get_play_stats(p_clerk_id TEXT)
RETURNS TABLE (
  daily_limit    INTEGER,
  weekly_limit   INTEGER,
  today_minutes  INTEGER,
  week_minutes   INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id       UUID;
  v_daily_lim     INTEGER := 120; -- default 2h
  v_weekly_lim    INTEGER := 840; -- default 14h
  v_today_mins    INTEGER := 0;
  v_week_mins     INTEGER := 0;
BEGIN
  v_user_id := public.get_internal_user_id(p_clerk_id);
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get limits
  SELECT daily_limit, weekly_limit INTO v_daily_lim, v_weekly_lim
  FROM gaming_hub.habits
  WHERE user_id = v_user_id;

  IF v_daily_lim IS NULL THEN
    v_daily_lim := 120;
    v_weekly_lim := 840;
  END IF;

  -- Calculate today's minutes
  SELECT COALESCE(SUM(duration), 0) INTO v_today_mins
  FROM gaming_hub.play_logs
  WHERE user_id = v_user_id AND log_date = current_date;

  -- Calculate past 7 days' minutes
  SELECT COALESCE(SUM(duration), 0) INTO v_week_mins
  FROM gaming_hub.play_logs
  WHERE user_id = v_user_id AND log_date >= (current_date - INTERVAL '7 days');

  RETURN QUERY SELECT v_daily_lim, v_weekly_lim, v_today_mins, v_week_mins;
END;
$$;

-- 8. DELETE LIBRARY ITEM
DROP FUNCTION IF EXISTS gaming_hub.delete_library_item(TEXT, UUID);
CREATE OR REPLACE FUNCTION gaming_hub.delete_library_item(
  p_clerk_id TEXT,
  p_item_id  UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_deleted INTEGER;
BEGIN
  v_user_id := public.get_internal_user_id(p_clerk_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for clerk_id: %', p_clerk_id;
  END IF;

  DELETE FROM gaming_hub.library
  WHERE id = p_item_id AND user_id = v_user_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

-- 9. GET DAILY TASK
DROP FUNCTION IF EXISTS gaming_hub.get_daily_task(TEXT);
CREATE OR REPLACE FUNCTION gaming_hub.get_daily_task(p_clerk_id TEXT)
RETURNS TABLE (
  id           UUID,
  game_name    TEXT,
  igdb_id      TEXT,
  cover_url    TEXT,
  goal_minutes INTEGER,
  completed    BOOLEAN,
  task_date    DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := public.get_internal_user_id(p_clerk_id);
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT d.id, d.game_name, d.igdb_id, d.cover_url, d.goal_minutes, d.completed, d.task_date
  FROM gaming_hub.daily_tasks d
  WHERE d.user_id = v_user_id AND d.task_date = current_date
  LIMIT 1;
END;
$$;

-- 10. SET DAILY TASK
DROP FUNCTION IF EXISTS gaming_hub.set_daily_task(TEXT, TEXT, TEXT, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION gaming_hub.set_daily_task(
  p_clerk_id     TEXT,
  p_game_name    TEXT,
  p_igdb_id      TEXT DEFAULT NULL,
  p_cover_url    TEXT DEFAULT NULL,
  p_goal_minutes INTEGER DEFAULT 60
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_task_id UUID;
BEGIN
  v_user_id := public.get_internal_user_id(p_clerk_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for clerk_id: %', p_clerk_id;
  END IF;

  INSERT INTO gaming_hub.daily_tasks (user_id, game_name, igdb_id, cover_url, goal_minutes, task_date, updated_at)
  VALUES (v_user_id, p_game_name, p_igdb_id, p_cover_url, p_goal_minutes, current_date, now())
  ON CONFLICT (user_id, task_date)
  DO UPDATE SET
    game_name = EXCLUDED.game_name,
    igdb_id = EXCLUDED.igdb_id,
    cover_url = EXCLUDED.cover_url,
    goal_minutes = EXCLUDED.goal_minutes,
    completed = false,
    updated_at = now()
  RETURNING id INTO v_task_id;

  RETURN v_task_id;
END;
$$;

-- 11. COMPLETE DAILY TASK
DROP FUNCTION IF EXISTS gaming_hub.complete_daily_task(TEXT);
CREATE OR REPLACE FUNCTION gaming_hub.complete_daily_task(p_clerk_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_updated INTEGER;
BEGIN
  v_user_id := public.get_internal_user_id(p_clerk_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for clerk_id: %', p_clerk_id;
  END IF;

  UPDATE gaming_hub.daily_tasks
  SET completed = true, updated_at = now()
  WHERE user_id = v_user_id AND task_date = current_date;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
