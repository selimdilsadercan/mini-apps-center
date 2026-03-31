DROP FUNCTION IF EXISTS subcenter_upsert_global_preset;

CREATE OR REPLACE FUNCTION subcenter_upsert_global_preset(
  name_param TEXT,
  plan_name_param TEXT,
  region_param TEXT,
  price_param DECIMAL,
  category_param TEXT,
  color_param TEXT,
  icon_param TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO subcenter_global_presets (
    name,
    plan_name,
    region,
    avg_price,
    category,
    color,
    icon,
    usage_count,
    last_updated
  )
  VALUES (
    name_param,
    plan_name_param,
    region_param,
    price_param,
    category_param,
    color_param,
    icon_param,
    1,
    NOW()
  )
  ON CONFLICT (name, plan_name, region) DO UPDATE SET
    avg_price = price_param,
    usage_count = subcenter_global_presets.usage_count + 1,
    category = EXCLUDED.category,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    last_updated = NOW();
END;
$$;
