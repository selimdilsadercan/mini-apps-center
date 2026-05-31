-- Drop old function
DROP FUNCTION IF EXISTS subcenter.get_user_items(TEXT);
DROP FUNCTION IF EXISTS public.subcenter_get_user_items(TEXT);

-- Create new function
CREATE OR REPLACE FUNCTION subcenter.get_user_items(clerk_id_param TEXT)
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
STABLE
AS $$
  SELECT 
    id,
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
    website,
    created_at
  FROM subcenter.items
  WHERE user_id = clerk_id_param
  ORDER BY created_at DESC;
$$;
