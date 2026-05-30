-- Add clerk_id column to reviews table
ALTER TABLE chocolate_db.reviews ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- Add unique constraint on (clerk_id, chocolate_id)
-- Ensure we drop the constraint if it already exists to avoid errors on reapplying
ALTER TABLE chocolate_db.reviews DROP CONSTRAINT IF EXISTS reviews_clerk_id_chocolate_id_key;
ALTER TABLE chocolate_db.reviews ADD CONSTRAINT reviews_clerk_id_chocolate_id_key UNIQUE (clerk_id, chocolate_id);
