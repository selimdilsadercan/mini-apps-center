DROP FUNCTION IF EXISTS chocolate_db.add_review(TEXT, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS chocolate_db.add_review(TEXT, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION chocolate_db.add_review(
    p_chocolate_id TEXT,
    p_rating INTEGER,
    p_comment TEXT,
    p_reviewer_name TEXT,
    p_clerk_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO chocolate_db.reviews (chocolate_id, rating, comment, reviewer_name, clerk_id)
    VALUES (p_chocolate_id, p_rating, p_comment, p_reviewer_name, p_clerk_id)
    ON CONFLICT (clerk_id, chocolate_id) 
    DO UPDATE SET 
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        reviewer_name = EXCLUDED.reviewer_name,
        created_at = now();
END;
$$;
