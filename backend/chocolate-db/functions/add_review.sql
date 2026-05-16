DROP FUNCTION IF EXISTS chocolate_db.add_review;

CREATE OR REPLACE FUNCTION chocolate_db.add_review(
    p_chocolate_id UUID,
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

    -- Update the chocolate's average rating and count
    UPDATE chocolate_db.chocolates
    SET 
        avg_rating = (SELECT AVG(rating) FROM chocolate_db.reviews WHERE chocolate_id = p_chocolate_id),
        review_count = (SELECT COUNT(*) FROM chocolate_db.reviews WHERE chocolate_id = p_chocolate_id)
    WHERE id = p_chocolate_id;
END;
$$;
