-- Drop old function
DROP FUNCTION IF EXISTS subcenter.create_item(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT);
DROP FUNCTION IF EXISTS subcenter.create_item(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.subcenter_create_item(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT);

-- Create new function
CREATE OR REPLACE FUNCTION subcenter.create_item(
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
LANGUAGE sql
VOLATILE
AS $$
  INSERT INTO subcenter.items (
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
    start_date,
    trial_duration,
    website
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
    start_date_param,
    trial_duration_param,
    website_param
  )
  RETURNING id, user_id, name, plan_name, region, price, currency, cycle, category, color, icon, start_date, trial_duration, website, created_at;
$$;
