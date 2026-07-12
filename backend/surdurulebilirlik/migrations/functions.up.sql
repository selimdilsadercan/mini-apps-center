-- 1. Get Sustainability Stats
DROP FUNCTION IF EXISTS surdurulebilirlik.get_stats(TEXT);
DROP FUNCTION IF EXISTS public.get_sustainability_stats(TEXT);
CREATE OR REPLACE FUNCTION public.get_sustainability_stats(p_user_id TEXT)
RETURNS TABLE (
    user_total_points NUMERIC,
    user_month_points NUMERIC
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT SUM((payload->>'amount')::numeric) FROM public.feed_events WHERE app_id = 'surdurulebilirlik' AND user_id = v_user_id), 0) as user_total_points,
        COALESCE((SELECT SUM((payload->>'amount')::numeric) FROM public.feed_events WHERE app_id = 'surdurulebilirlik' AND user_id = v_user_id AND created_at >= date_trunc('month', now())), 0) as user_month_points;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grants
GRANT ALL ON FUNCTION public.get_sustainability_stats(TEXT) TO anon, authenticated, service_role;
