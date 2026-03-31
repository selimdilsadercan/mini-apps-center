DROP FUNCTION IF EXISTS subcenter_update_item(UUID, UUID, TEXT, DECIMAL, TEXT, TEXT, TEXT, TEXT, TEXT, DATE);
DROP FUNCTION IF EXISTS subcenter_update_item(UUID, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT, TEXT, TEXT, DATE);

CREATE OR REPLACE FUNCTION subcenter_update_item(
  item_id_param UUID,
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
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  RETURN QUERY
  UPDATE subcenter_items
  SET 
    name = name_param,
    plan_name = plan_name_param,
    region = region_param,
    price = price_param,
    currency = currency_param,
    cycle = cycle_param,
    category = category_param,
    color = color_param,
    icon = icon_param,
    start_date = start_date_param
  WHERE subcenter_items.id = item_id_param
    AND subcenter_items.user_id = clerk_id_param
  RETURNING 
    subcenter_items.id,
    subcenter_items.user_id,
    subcenter_items.name,
    subcenter_items.plan_name,
    subcenter_items.region,
    subcenter_items.price,
    subcenter_items.currency,
    subcenter_items.cycle,
    subcenter_items.category,
    subcenter_items.color,
    subcenter_items.icon,
    subcenter_items.start_date,
    subcenter_items.created_at;
END;
$$;
