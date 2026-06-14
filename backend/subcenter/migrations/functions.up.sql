-- FUNCTIONS
-- 1. subcenter.get_user_items
-- 2. subcenter.create_item
-- 3. subcenter.update_item
-- 4. subcenter.delete_item

-- 1. Get User Items
DROP FUNCTION IF EXISTS subcenter.get_user_items(TEXT);
CREATE OR REPLACE FUNCTION subcenter.get_user_items(p_user_id TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  plan_name TEXT,
  region TEXT,
  price DECIMAL,
  currency TEXT,
  cycle TEXT,
  category TEXT,
  color TEXT,
  icon TEXT,
  start_date DATE,
  trial_duration TEXT,
  website TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.user_id,
    i.name,
    i.plan_name,
    i.region,
    i.price,
    i.currency,
    i.cycle,
    i.category,
    i.color,
    i.icon,
    i.start_date,
    i.trial_duration,
    i.website,
    i.created_at
  FROM subcenter.items i
  WHERE i.user_id = v_user_id
  ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Create Item
DROP FUNCTION IF EXISTS subcenter.create_item(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT);
CREATE OR REPLACE FUNCTION subcenter.create_item(
  p_user_id TEXT,
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
  user_id UUID,
  name TEXT,
  plan_name TEXT,
  region TEXT,
  price DECIMAL,
  currency TEXT,
  cycle TEXT,
  category TEXT,
  color TEXT,
  icon TEXT,
  start_date DATE,
  trial_duration TEXT,
  website TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
  RETURN QUERY
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
    v_user_id,
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
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- 3. Update Item
DROP FUNCTION IF EXISTS subcenter.update_item(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT);
CREATE OR REPLACE FUNCTION subcenter.update_item(
  item_id_param UUID,
  p_user_id TEXT,
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
  user_id UUID,
  name TEXT,
  plan_name TEXT,
  region TEXT,
  price DECIMAL,
  currency TEXT,
  cycle TEXT,
  category TEXT,
  color TEXT,
  icon TEXT,
  start_date DATE,
  trial_duration TEXT,
  website TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID := public.get_internal_user_id(p_user_id);
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
    AND subcenter.items.user_id = v_user_id
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
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- 4. Delete Item
DROP FUNCTION IF EXISTS subcenter.delete_item(UUID, TEXT);
CREATE OR REPLACE FUNCTION subcenter.delete_item(
  item_id_param UUID,
  p_user_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := public.get_internal_user_id(p_user_id);
  deleted_count INTEGER;
BEGIN
  DELETE FROM subcenter.items
  WHERE id = item_id_param
    AND user_id = v_user_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
