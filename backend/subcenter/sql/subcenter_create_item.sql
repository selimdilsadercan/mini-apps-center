DROP FUNCTION IF EXISTS subcenter_create_item;

CREATE OR REPLACE FUNCTION subcenter_create_item(
  clerk_id_param TEXT,
  name_param TEXT,
  plan_name_param TEXT,
  region_param TEXT,
  price_param NUMERIC,
  currency_param TEXT,
  cycle_param TEXT,
  category_param TEXT,
  color_param TEXT,
  icon_param TEXT,
  start_date_param DATE
)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  name TEXT,
  plan_name TEXT,
  region TEXT,
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
VOLATILE
AS $$
  INSERT INTO subcenter_items (
    user_id,
    name,
    plan_name,
    region,
    price,
    currency,
    cycle,
    category,
    color,
    icon,
    start_date
  )
  VALUES (
    clerk_id_param,
    name_param,
    plan_name_param,
    region_param,
    price_param,
    currency_param,
    cycle_param,
    category_param,
    color_param,
    icon_param,
    start_date_param
  )
  RETURNING id, user_id, name, plan_name, region, price, currency, cycle, category, color, icon, start_date, created_at;
$$;
