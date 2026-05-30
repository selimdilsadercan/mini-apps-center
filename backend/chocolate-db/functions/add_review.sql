DROP FUNCTION IF EXISTS chocolate_db.add_review;

CREATE OR REPLACE FUNCTION chocolate_db.add_review(
    p_chocolate_id TEXT,
    p_rating INTEGER,
    p_comment TEXT,
    p_reviewer_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert the review
    INSERT INTO chocolate_db.reviews (chocolate_id, rating, comment, reviewer_name)
    VALUES (p_chocolate_id, p_rating, p_comment, p_reviewer_name);
END;
$$;
