-- Update categories check constraint
ALTER TABLE suggest.suggestions 
DROP CONSTRAINT IF EXISTS suggestions_category_check;

ALTER TABLE suggest.suggestions 
ADD CONSTRAINT suggestions_category_check 
CHECK (category IN ('song', 'movie', 'tv', 'video', 'place', 'book'));
