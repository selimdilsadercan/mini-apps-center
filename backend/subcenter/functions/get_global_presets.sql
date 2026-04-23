-- Drop old function
DROP FUNCTION IF EXISTS public.subcenter_get_global_presets(INTEGER);

-- Create new function
CREATE OR REPLACE FUNCTION subcenter.get_global_presets(limit_param INTEGER)
RETURNS SETOF subcenter.global_presets
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM subcenter.global_presets
  ORDER BY usage_count DESC, last_updated DESC
  LIMIT limit_param;
$$;
