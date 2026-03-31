DROP FUNCTION IF EXISTS subcenter_get_global_presets;

CREATE OR REPLACE FUNCTION subcenter_get_global_presets(limit_param INTEGER)
RETURNS SETOF subcenter_global_presets
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM subcenter_global_presets
  ORDER BY usage_count DESC, last_updated DESC
  LIMIT limit_param;
$$;
