-- Remove winner_id columns from tournaments and matches
-- We will calculate winners dynamically from scores

ALTER TABLE tournament.tournaments DROP COLUMN IF EXISTS winner_id;
ALTER TABLE tournament.matches DROP COLUMN IF EXISTS winner_id;
