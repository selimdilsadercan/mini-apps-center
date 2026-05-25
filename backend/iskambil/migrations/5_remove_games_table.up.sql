-- Drop foreign key constraints on dependent tables
ALTER TABLE iskambil.favorites DROP CONSTRAINT IF EXISTS favorites_game_id_fkey;
ALTER TABLE iskambil.notes DROP CONSTRAINT IF EXISTS notes_game_id_fkey;
ALTER TABLE iskambil.known_games DROP CONSTRAINT IF EXISTS known_games_game_id_fkey;

-- Drop games table entirely
DROP TABLE IF EXISTS iskambil.games CASCADE;
