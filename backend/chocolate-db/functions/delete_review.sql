DROP FUNCTION IF EXISTS chocolate_db.delete_review(TEXT, TEXT);

CREATE OR REPLACE FUNCTION chocolate_db.delete_review(
    p_chocolate_id TEXT,
    p_clerk_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM chocolate_db.reviews 
    WHERE chocolate_id = p_chocolate_id AND clerk_id = p_clerk_id;
END;
$$;
