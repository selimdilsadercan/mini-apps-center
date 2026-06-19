-- FUNCTIONS
-- 1. series_track.get_user_series
-- 2. series_track.add_user_series
-- 3. series_track.update_user_series_status
-- 4. series_track.delete_user_series
-- 5. series_track.get_user_progress
-- 6. series_track.toggle_episode_watched

DROP FUNCTION IF EXISTS series_track.get_user_series(TEXT);
DROP FUNCTION IF EXISTS series_track.add_user_series(TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS series_track.add_user_series(TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 1. get_user_series
CREATE OR REPLACE FUNCTION series_track.get_user_series(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    tmdb_id INTEGER,
    title TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    status TEXT,
    watch_url_slug TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    RETURN QUERY
    SELECT s.id, s.tmdb_id, s.title, s.poster_path, s.backdrop_path, s.status, s.watch_url_slug, s.created_at, s.updated_at
    FROM series_track.user_series s
    WHERE s.user_id = v_user_id
    ORDER BY s.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. add_user_series
CREATE OR REPLACE FUNCTION series_track.add_user_series(
    clerk_id_param TEXT,
    tmdb_id_param INTEGER,
    title_param TEXT,
    poster_path_param TEXT,
    backdrop_path_param TEXT,
    status_param TEXT DEFAULT 'watching',
    watch_url_slug_param TEXT DEFAULT NULL
)
RETURNS series_track.user_series AS $$
DECLARE
    v_user_id UUID;
    v_new_series series_track.user_series;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO series_track.user_series (
        user_id, tmdb_id, title, poster_path, backdrop_path, status, watch_url_slug
    ) VALUES (
        v_user_id, tmdb_id_param, title_param, poster_path_param, backdrop_path_param, status_param, watch_url_slug_param
    )
    ON CONFLICT (user_id, tmdb_id) DO UPDATE SET
        status = EXCLUDED.status,
        watch_url_slug = COALESCE(watch_url_slug_param, series_track.user_series.watch_url_slug),
        updated_at = NOW()
    RETURNING * INTO v_new_series;

    RETURN v_new_series;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. update_user_series_status
CREATE OR REPLACE FUNCTION series_track.update_user_series_status(
    clerk_id_param TEXT,
    series_id_param UUID,
    status_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    UPDATE series_track.user_series
    SET status = status_param,
        updated_at = NOW()
    WHERE id = series_id_param AND user_id = v_user_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. delete_user_series
CREATE OR REPLACE FUNCTION series_track.delete_user_series(
    clerk_id_param TEXT,
    series_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    DELETE FROM series_track.user_series
    WHERE id = series_id_param AND user_id = v_user_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. get_user_progress
CREATE OR REPLACE FUNCTION series_track.get_user_progress(
    clerk_id_param TEXT,
    series_id_param UUID
)
RETURNS TABLE (
    season_number INTEGER,
    episode_number INTEGER,
    watched_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    RETURN QUERY
    SELECT p.season_number, p.episode_number, p.watched_at
    FROM series_track.user_progress p
    WHERE p.user_id = v_user_id AND p.series_id = series_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. toggle_episode_watched
CREATE OR REPLACE FUNCTION series_track.toggle_episode_watched(
    clerk_id_param TEXT,
    series_id_param UUID,
    season_number_param INTEGER,
    episode_number_param INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    
    SELECT EXISTS (
        SELECT 1 FROM series_track.user_progress
        WHERE user_id = v_user_id 
          AND series_id = series_id_param 
          AND season_number = season_number_param 
          AND episode_number = episode_number_param
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM series_track.user_progress
        WHERE user_id = v_user_id 
          AND series_id = series_id_param 
          AND season_number = season_number_param 
          AND episode_number = episode_number_param;
        RETURN FALSE; -- Unwatched
    ELSE
        INSERT INTO series_track.user_progress (
            user_id, series_id, season_number, episode_number
        ) VALUES (
            v_user_id, series_id_param, season_number_param, episode_number_param
        );
        RETURN TRUE; -- Watched
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. mark_episodes_watched
CREATE OR REPLACE FUNCTION series_track.mark_episodes_watched(
    clerk_id_param TEXT,
    series_id_param UUID,
    season_number_param INTEGER,
    episode_numbers_param INTEGER[]
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_ep_num INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    
    FOREACH v_ep_num IN ARRAY episode_numbers_param
    LOOP
        INSERT INTO series_track.user_progress (
            user_id, series_id, season_number, episode_number
        ) VALUES (
            v_user_id, series_id_param, season_number_param, v_ep_num
        )
        ON CONFLICT (user_id, series_id, season_number, episode_number) DO NOTHING;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. mark_all_episodes_watched
CREATE OR REPLACE FUNCTION series_track.mark_all_episodes_watched(
    clerk_id_param TEXT,
    series_id_param UUID,
    seasons_data_param JSONB -- Format: [{"season": 1, "count": 10}, ...]
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_season RECORD;
    v_ep_num INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    
    FOR v_season IN SELECT * FROM jsonb_to_recordset(seasons_data_param) AS x(season int, count int)
    LOOP
        FOR v_ep_num IN 1..v_season.count
        LOOP
            INSERT INTO series_track.user_progress (
                user_id, series_id, season_number, episode_number
            ) VALUES (
                v_user_id, series_id_param, v_season.season, v_ep_num
            )
            ON CONFLICT (user_id, series_id, season_number, episode_number) DO NOTHING;
        END LOOP;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for all functions to roles
GRANT ALL ON ALL FUNCTIONS IN SCHEMA series_track TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA series_track GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
