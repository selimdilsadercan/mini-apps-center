CREATE OR REPLACE FUNCTION subcenter.get_categories()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, icon, color, sort_order
  FROM subcenter.categories
  ORDER BY sort_order ASC, name ASC;
$$;
