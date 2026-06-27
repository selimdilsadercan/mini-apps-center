-- Get all upcoming shows with comedian details
CREATE OR REPLACE FUNCTION public.get_upcoming_shows()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(t)
        FROM (
            SELECT 
                s.*,
                c.name as comedian_name,
                c.image_url as comedian_image
            FROM public.standup_shows s
            JOIN public.standup_comedians c ON s.comedian_id = c.id
            WHERE s.show_date >= NOW()
            ORDER BY s.show_date ASC
        ) t
    );
END;
$$;

-- Get comedian details with their shows and videos
CREATE OR REPLACE FUNCTION public.get_comedian_full_details(p_comedian_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comedian JSONB;
    v_shows JSONB;
    v_videos JSONB;
BEGIN
    -- Get comedian basic info
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'bio', bio,
        'image_url', image_url,
        'instagram_username', instagram_username,
        'youtube_channel_id', youtube_channel_id
    ) INTO v_comedian
    FROM public.standup_comedians
    WHERE id = p_comedian_id;

    IF v_comedian IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get upcoming shows
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_shows
    FROM (
        SELECT *
        FROM public.standup_shows
        WHERE comedian_id = p_comedian_id
        ORDER BY show_date ASC
    ) t;

    -- Get videos
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_videos
    FROM (
        SELECT *
        FROM public.standup_videos
        WHERE comedian_id = p_comedian_id
        ORDER BY created_at DESC
    ) t;

    RETURN jsonb_build_object(
        'comedian', v_comedian,
        'shows', v_shows,
        'videos', v_videos
    );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.get_upcoming_shows() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_comedian_full_details(TEXT) TO anon, authenticated, service_role;
