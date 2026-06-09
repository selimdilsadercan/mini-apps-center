ALTER TABLE chocolate_db.reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;
ALTER TABLE chocolate_db.reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 10);
