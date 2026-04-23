-- player3 ve player4 kolonlarının referanslarını düzelt
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_player3_id_fkey;
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_player4_id_fkey;

ALTER TABLE tournament_matches 
  ADD CONSTRAINT tournament_matches_player3_id_fkey 
  FOREIGN KEY (player3_id) REFERENCES tournament_participants(id) ON DELETE SET NULL;

ALTER TABLE tournament_matches 
  ADD CONSTRAINT tournament_matches_player4_id_fkey 
  FOREIGN KEY (player4_id) REFERENCES tournament_participants(id) ON DELETE SET NULL;

-- player1 ve player2'nin de doğru tabloya (tournament_participants) baktığından emin olalım
-- (Genelde bunlar zaten doğrudur ama çoklu oyuncu modunda tutarlılık için kontrol edilmeli)
