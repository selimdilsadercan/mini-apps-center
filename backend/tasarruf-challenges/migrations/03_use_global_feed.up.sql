-- Migration to update get_stats to use public.feed_events instead of tasarruf_challenges.posts
DROP FUNCTION IF EXISTS tasarruf_challenges.get_stats(TEXT);

CREATE OR REPLACE FUNCTION tasarruf_challenges.get_stats(p_user_id TEXT)
RETURNS TABLE (
    user_total_savings NUMERIC,
    user_month_savings NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT SUM((payload->>'amount')::numeric) FROM public.feed_events WHERE app_id = 'tasarruf-challenges' AND user_id = p_user_id), 0) as user_total_savings,
        COALESCE((SELECT SUM((payload->>'amount')::numeric) FROM public.feed_events WHERE app_id = 'tasarruf-challenges' AND user_id = p_user_id AND created_at >= date_trunc('month', now())), 0) as user_month_savings;
END;
$$;

-- Grant permissions
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
