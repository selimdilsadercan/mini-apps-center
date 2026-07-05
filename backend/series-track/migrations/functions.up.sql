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

-- TV Guide Functions
-- 9. series_track.get_channels
-- 10. series_track.get_program_details
-- 11. series_track.toggle_program_episode_watched
-- 12. series_track.get_program_episode_stats
-- 13. series_track.seed_tv_initial_programs

-- 9. Get Channels with active programs
DROP FUNCTION IF EXISTS series_track.get_channels();
CREATE OR REPLACE FUNCTION series_track.get_channels()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    slug TEXT,
    icon TEXT,
    color TEXT,
    active_program JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.slug,
        c.icon,
        c.color,
        (
            SELECT jsonb_build_object(
                'id', p.id,
                'title', p.title,
                'description', p.description,
                'cover_image', p.cover_image,
                'status', p.status,
                'start_date', p.start_date,
                'schedule_type', p.schedule_type,
                'total_episodes', p.total_episodes,
                'tmdb_id', p.tmdb_id,
                'season_number', p.season_number
            )
            FROM series_track.programs p
            WHERE p.channel_id = c.id AND p.status = 'active'
            ORDER BY p.start_date DESC
            LIMIT 1
        ) AS active_program
    FROM series_track.channels c
    ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10. Get Program Details and Episodes for a User
DROP FUNCTION IF EXISTS series_track.get_program_details(UUID, TEXT);
CREATE OR REPLACE FUNCTION series_track.get_program_details(p_program_id UUID, p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    channel_id UUID,
    title TEXT,
    description TEXT,
    cover_image TEXT,
    status TEXT,
    start_date TIMESTAMPTZ,
    schedule_type TEXT,
    total_episodes INTEGER,
    tmdb_id INTEGER,
    season_number INTEGER,
    episodes JSONB
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Resolve user ID (if authenticated)
    IF p_user_id IS NOT NULL AND p_user_id <> '' THEN
        v_user_id := public.get_internal_user_id(p_user_id);
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.channel_id,
        p.title,
        p.description,
        p.cover_image,
        p.status,
        p.start_date,
        p.schedule_type,
        p.total_episodes,
        p.tmdb_id,
        p.season_number,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', e.id,
                        'episode_number', e.episode_number,
                        'title', e.title,
                        'description', e.description,
                        'stream_info', e.stream_info,
                        'release_date', e.release_date,
                        'is_released', (e.release_date <= NOW()),
                        'watched', EXISTS(
                            SELECT 1 FROM series_track.user_progress up
                            JOIN series_track.user_series us ON us.id = up.series_id
                            WHERE us.user_id = v_user_id
                              AND us.tmdb_id = p.tmdb_id
                              AND up.season_number = p.season_number
                              AND up.episode_number = e.episode_number
                        ),
                        'emoji_reaction', null
                    )
                    ORDER BY e.episode_number ASC
                )
                FROM series_track.episodes e
                WHERE e.program_id = p.id
            ),
            '[]'::jsonb
        ) AS episodes
    FROM series_track.programs p
    WHERE p.id = p_program_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 11. Toggle Program Episode Watched (Dummy/Placeholder since backend handles it directly via toggle_episode_watched now)
DROP FUNCTION IF EXISTS series_track.toggle_program_episode_watched(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION series_track.toggle_program_episode_watched(
    p_episode_id UUID,
    p_user_id TEXT,
    p_emoji_reaction TEXT
)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object('watched', true, 'emoji_reaction', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 12. Get Program Episode Stats (Watch Count, Emojis)
DROP FUNCTION IF EXISTS series_track.get_program_episode_stats(UUID);
CREATE OR REPLACE FUNCTION series_track.get_program_episode_stats(p_episode_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_watch_count INTEGER := 0;
    v_tmdb_id INTEGER;
    v_season_number INTEGER;
    v_episode_number INTEGER;
    v_result JSONB;
BEGIN
    -- Get program TMDB details
    SELECT p.tmdb_id, p.season_number, e.episode_number
    INTO v_tmdb_id, v_season_number, v_episode_number
    FROM series_track.episodes e
    JOIN series_track.programs p ON p.id = e.program_id
    WHERE e.id = p_episode_id;

    -- Count watches from user_progress
    SELECT COUNT(*) INTO v_watch_count
    FROM series_track.user_progress up
    JOIN series_track.user_series us ON us.id = up.series_id
    WHERE us.tmdb_id = v_tmdb_id 
      AND up.season_number = v_season_number 
      AND up.episode_number = v_episode_number;

    v_result := jsonb_build_object(
        'watch_count', v_watch_count,
        'emojis', '{}'::jsonb
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Seed TV Programs & Episodes
DROP FUNCTION IF EXISTS series_track.seed_tv_initial_programs();
CREATE OR REPLACE FUNCTION series_track.seed_tv_initial_programs()
RETURNS BOOLEAN AS $$
DECLARE
    v_drama_id UUID;
    v_comedy_id UUID;
    v_scifi_id UUID;
    v_cult_id UUID;
    
    v_prog_suits_id UUID;
    v_prog_office_id UUID;
    v_prog_mirror_id UUID;
    
    v_ep_id UUID;
    
    i INTEGER;
BEGIN
    -- Get Channel IDs
    SELECT id FROM series_track.channels WHERE slug = 'drama' INTO v_drama_id;
    SELECT id FROM series_track.channels WHERE slug = 'comedy' INTO v_comedy_id;
    SELECT id FROM series_track.channels WHERE slug = 'scifi' INTO v_scifi_id;
    SELECT id FROM series_track.channels WHERE slug = 'cult' INTO v_cult_id;

    -- Add Drama Program: Suits Daily (Seeded with TMDB mapping)
    DELETE FROM series_track.programs WHERE title = 'Suits Daily';
    IF v_drama_id IS NOT NULL THEN
        INSERT INTO series_track.programs (channel_id, title, description, cover_image, status, start_date, schedule_type, total_episodes, tmdb_id, season_number)
        VALUES (
            v_drama_id,
            'Suits Daily',
            'Harvey ve ekibinin, Mike hapse girdikten sonra firmayı kurtarma ve yeniden ayağa kaldırma mücadelesi.',
            'https://image.tmdb.org/t/p/w500/vQW46U1N511gZBuOC1vt0t6aPBg.jpg', -- Suits poster!
            'active',
            NOW() - INTERVAL '1 day', -- Started 1 day ago so Ep 2 is today
            'daily',
            8,
            37680, -- Suits TMDB ID
            6 -- Season 6
        ) RETURNING id INTO v_prog_suits_id;

        -- Create Episodes for Suits Season 6
        -- Episode 1 (Released yesterday)
        INSERT INTO series_track.episodes (program_id, episode_number, title, description, stream_info, release_date)
        VALUES (
            v_prog_suits_id,
            1,
            'To Trouble',
            'Harvey, Louis ve Donna, Pearson Specter Litt''in yıkıntısıyla başa çıkmaya çalışırken, Mike hapishane yaşamına uyum sağlamaya çalışır.',
            'Netflix',
            NOW() - INTERVAL '1 day'
        );

        -- Episode 2 (Released today)
        INSERT INTO series_track.episodes (program_id, episode_number, title, description, stream_info, release_date)
        VALUES (
            v_prog_suits_id,
            2,
            'Accounts Payable',
            'Mike, hapishane arkadaşıyla başa çıkmaya çalışırken, Harvey ve Louis firmaya dava açan alacaklıları durdurmaya çalışır.',
            'Netflix',
            NOW()
        );

        -- Episode 3 (Released tomorrow)
        INSERT INTO series_track.episodes (program_id, episode_number, title, description, stream_info, release_date)
        VALUES (
            v_prog_suits_id,
            3,
            'Back on the Map',
            'Rachel, hapishanede bir hücre arkadaşıyla kavga eden Mike için endişelenirken, Harvey önemli bir müşteriyi geri kazanmaya çalışır.',
            'Netflix',
            NOW() + INTERVAL '1 day'
        );

        -- Episode 4 (Released in 2 days)
        INSERT INTO series_track.episodes (program_id, episode_number, title, description, stream_info, release_date)
        VALUES (
            v_prog_suits_id,
            4,
            'Turn',
            'Mike, Harvey''nin sunduğu riskli bir teklifi değerlendirirken, Donna ve Louis yeni ofis kiracılarıyla uğraşır.',
            'Netflix',
            NOW() + INTERVAL '2 days'
        );

        -- Episode 5 (Released in 3 days)
        INSERT INTO series_track.episodes (program_id, episode_number, title, description, stream_info, release_date)
        VALUES (
            v_prog_suits_id,
            5,
            'Trust',
            'Mike, serbest kalabilmek için Kevin ile güven ilişkisi kurmaya çalışırken, Harvey etik açıdan zor bir davayı üstlenir.',
            'Netflix',
            NOW() + INTERVAL '3 days'
        );

        -- Episode 6 (Released in 4 days)
        INSERT INTO series_track.episodes (program_id, episode_number, title, description, stream_info, release_date)
        VALUES (
            v_prog_suits_id,
            6,
            'Spain',
            'Harvey, Mike''ın davasında ilerleme kaydetmek için eski bir dostundan yardım ister.',
            'Netflix',
            NOW() + INTERVAL '4 days'
        );

        -- Episode 7 (Released in 5 days)
        INSERT INTO series_track.episodes (program_id, episode_number, title, description, stream_info, release_date)
        VALUES (
            v_prog_suits_id,
            7,
            'Shake the Trees',
            'Harvey ve Sean Cahill, Sutter''ın içeriden bilgi ticareti yaptığına dair kanıt bulmaya çalışır.',
            'Netflix',
            NOW() + INTERVAL '5 days'
        );

        -- Episode 8 (Released in 6 days)
        INSERT INTO series_track.episodes (program_id, episode_number, title, description, stream_info, release_date)
        VALUES (
            v_prog_suits_id,
            8,
            'Borrowed Time',
            'Harvey, Mike''ın anlaşmasını korumak için zamanla yarışır.',
            'Netflix',
            NOW() + INTERVAL '6 days'
        );
    END IF;

    -- Add Comedy Program: The Office Daily
    IF v_comedy_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM series_track.programs WHERE title = 'The Office Daily') THEN
        INSERT INTO series_track.programs (channel_id, title, description, cover_image, status, start_date, schedule_type, total_episodes)
        VALUES (
            v_comedy_id,
            'The Office Daily',
            'Dunder Mifflin kağıt şirketinin Scranton şubesinde sıradan bir iş günü... Tabii Michael Scott varken ne kadar sıradan olabilirse!',
            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600',
            'active',
            NOW() - INTERVAL '1 day',
            'daily',
            6
        ) RETURNING id INTO v_prog_office_id;

        -- Create Episodes for The Office
        FOR i IN 1..6 LOOP
            INSERT INTO series_track.episodes (program_id, episode_number, title, description, stream_info, release_date)
            VALUES (
                v_prog_office_id,
                i,
                'Sezon 1 Bölüm ' || i || ': ' || CASE 
                    WHEN i = 1 THEN 'Pilot' 
                    WHEN i = 2 THEN 'Çeşitlilik Günü' 
                    WHEN i = 3 THEN 'Sağlık Planı' 
                    ELSE 'Ofis İçi İttifak' END,
                'Michael Scott ve ekibinin komik, absürt ve bazen de utanç verici ofis halleri.',
                'Amazon Prime Video / Netflix',
                NOW() - INTERVAL '1 day' + (i - 1) * INTERVAL '1 day'
            );
        END LOOP;
    END IF;

    -- Add SciFi Program: Black Mirror Weekly
    IF v_scifi_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM series_track.programs WHERE title = 'Black Mirror Anthology') THEN
        INSERT INTO series_track.programs (channel_id, title, description, cover_image, status, start_date, schedule_type, total_episodes)
        VALUES (
            v_scifi_id,
            'Black Mirror Anthology',
            'Teknolojinin hayatlarimizi nasil ele geçirdigine ve karanlik geleceklere ayna tutan bagimsiz hikayeler. Her hafta yeni bir distopya.',
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
            'active',
            NOW() - INTERVAL '14 days',
            'weekly',
            3
        ) RETURNING id INTO v_prog_mirror_id;

        -- Create Episodes for Black Mirror
        FOR i IN 1..3 LOOP
            INSERT INTO series_track.episodes (program_id, episode_number, title, description, stream_info, release_date)
            VALUES (
                v_prog_mirror_id,
                i,
                'Bölüm ' || i || ': ' || CASE 
                    WHEN i = 1 THEN 'Ulusal Marş' 
                    WHEN i = 2 THEN '15 Milyon Hak' 
                    ELSE 'Senin Tüm Geçmişin' END,
                'Teknolojinin, medyanın ve modern yaşamın distopik yansımalarını inceleyen sarsıcı öykü.',
                'Netflix',
                NOW() - INTERVAL '14 days' + (i - 1) * INTERVAL '7 days'
            );
        END LOOP;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Set Active Program Episode
DROP FUNCTION IF EXISTS series_track.set_active_program_episode(UUID, INTEGER);
CREATE OR REPLACE FUNCTION series_track.set_active_program_episode(
    p_program_id UUID,
    p_target_episode_number INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_episode RECORD;
BEGIN
    -- Loop through all episodes of the program and shift release dates relative to today (NOW())
    FOR v_episode IN 
        SELECT id, episode_number 
        FROM series_track.episodes 
        WHERE program_id = p_program_id
    LOOP
        UPDATE series_track.episodes 
        SET release_date = NOW() + (v_episode.episode_number - p_target_episode_number) * INTERVAL '1 day'
        WHERE id = v_episode.id;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trigger TV seed
SELECT series_track.seed_tv_initial_programs();

-- Grant execute permission for all functions to roles
GRANT ALL ON ALL FUNCTIONS IN SCHEMA series_track TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA series_track GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

