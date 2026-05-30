-- Drop old function
DROP FUNCTION IF EXISTS subcenter.update_item(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT);
DROP FUNCTION IF EXISTS subcenter.update_item(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.subcenter_update_item(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, DATE);

-- Create new function
CREATE OR REPLACE FUNCTION subcenter.update_item(
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
  start_date_param DATE,
  trial_duration_param TEXT DEFAULT NULL,
  website_param TEXT DEFAULT NULL
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
  trial_duration TEXT,
  website TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  RETURN QUERY
  UPDATE subcenter.items
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
    start_date = start_date_param,
    trial_duration = trial_duration_param,
    website = website_param
  WHERE subcenter.items.id = item_id_param
    AND subcenter.items.user_id = clerk_id_param
  RETURNING 
    subcenter.items.id,
    subcenter.items.user_id,
    subcenter.items.name,
    subcenter.items.plan_name,
    subcenter.items.region,
    subcenter.items.price,
    subcenter.items.currency,
    subcenter.items.cycle,
    subcenter.items.category,
    subcenter.items.color,
    subcenter.items.icon,
    subcenter.items.start_date,
    subcenter.items.trial_duration,
    subcenter.items.website,
    subcenter.items.created_at;
END;
$$;
