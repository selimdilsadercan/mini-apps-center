DROP FUNCTION IF EXISTS subcenter_get_user_items;

CREATE FUNCTION subcenter_get_user_items(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  price DECIMAL,
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
    id, user_id, name, price, currency, cycle,
    category, color, icon, start_date, created_at
  FROM subcenter_items
  WHERE user_id = user_id_param
  ORDER BY created_at DESC;
$$;
