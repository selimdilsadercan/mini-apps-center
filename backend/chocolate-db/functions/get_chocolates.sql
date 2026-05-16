DROP FUNCTION IF EXISTS chocolate_db.get_chocolates;

CREATE OR REPLACE FUNCTION chocolate_db.get_chocolates()
RETURNS SETOF chocolate_db.chocolates
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM chocolate_db.chocolates
    ORDER BY avg_rating DESC, name ASC;
$$;
