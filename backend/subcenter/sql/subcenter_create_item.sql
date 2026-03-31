DROP FUNCTION IF EXISTS subcenter_create_item;

CREATE FUNCTION subcenter_create_item(
  user_id_param UUID,
  name_param TEXT,
  price_param DECIMAL,
  currency_param TEXT,
  cycle_param TEXT,
  category_param TEXT,
  color_param TEXT,
  icon_param TEXT,
  start_date_param DATE
)
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
VOLATILE
AS $$
  INSERT INTO subcenter_items (user_id, name, price, currency, cycle, category, color, icon, start_date)
  VALUES (user_id_param, name_param, price_param, currency_param, cycle_param, category_param, color_param, icon_param, start_date_param)
  RETURNING id, user_id, name, price, currency, cycle, category, color, icon, start_date, created_at;
$$;
