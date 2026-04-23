-- 1. Mevcut kısıtlamaları (Foreign Key) temizle (Hata almamak için)
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_player1_id_fkey;
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_player2_id_fkey;
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_player3_id_fkey;
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_player4_id_fkey;

-- 2. Kolonları ekle (Yoksa)
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS player3_id UUID;
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS player4_id UUID;
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS score3 INTEGER DEFAULT 0;
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS score4 INTEGER DEFAULT 0;

-- 3. Doğru referansları (tournament_participants) tanımla
-- Not: Manuel oyuncuların maçlarda görünebilmesi için katılımcı tablosuna referans vermeliyiz
ALTER TABLE tournament_matches 
  ADD CONSTRAINT tournament_matches_player1_id_fkey 
  FOREIGN KEY (player1_id) REFERENCES tournament_participants(id) ON DELETE SET NULL;

ALTER TABLE tournament_matches 
  ADD CONSTRAINT tournament_matches_player2_id_fkey 
  FOREIGN KEY (player2_id) REFERENCES tournament_participants(id) ON DELETE SET NULL;

ALTER TABLE tournament_matches 
  ADD CONSTRAINT tournament_matches_player3_id_fkey 
  FOREIGN KEY (player3_id) REFERENCES tournament_participants(id) ON DELETE SET NULL;

ALTER TABLE tournament_matches 
  ADD CONSTRAINT tournament_matches_player4_id_fkey 
  FOREIGN KEY (player4_id) REFERENCES tournament_participants(id) ON DELETE SET NULL;

-- 4. Katılımcı tablosunda user_id'yi opsiyonel yap
ALTER TABLE tournament_participants ALTER COLUMN user_id DROP NOT NULL;
