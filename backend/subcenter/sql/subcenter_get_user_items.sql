DROP FUNCTION IF EXISTS subcenter_get_user_items;

CREATE FUNCTION subcenter_get_user_items(clerk_id_param TEXT)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  name TEXT,
  price NUMERIC,
  currency TEXT,
  cycle TEXT,
  category TEXT,
  color TEXT,
  icon TEXT,
  start_date DATE,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    user_id,
    name,
    price,
    currency,
    cycle,
    category,
    color,
    icon,
    start_date,
    created_at
  FROM subcenter_items
  WHERE user_id = clerk_id_param
  ORDER BY created_at DESC;
$$;
