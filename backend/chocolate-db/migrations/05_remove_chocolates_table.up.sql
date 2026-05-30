-- Drop foreign key constraint on reviews table
ALTER TABLE chocolate_db.reviews DROP CONSTRAINT IF EXISTS reviews_chocolate_id_fkey;

-- Drop chocolates table
DROP TABLE IF EXISTS chocolate_db.chocolates CASCADE;

-- Alter chocolate_id type to TEXT in reviews
ALTER TABLE chocolate_db.reviews ALTER COLUMN chocolate_id TYPE TEXT;
