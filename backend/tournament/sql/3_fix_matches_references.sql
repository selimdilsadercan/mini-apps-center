-- Maçların users yerine katılımcılara referans vermesini sağlayalım
-- Önce eski kısıtlamaları kaldıralım
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_player1_id_fkey;
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_player2_id_fkey;
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_winner_id_fkey;

-- player1_id, player2_id ve winner_id artık tournament_participants.id (UUID) değerlerini tutacak
-- Tablo isimleri ve tipler zaten UUID olduğu için sadece referansları güncelliyoruz
ALTER TABLE tournament_matches 
  ADD CONSTRAINT tournament_matches_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES tournament_participants(id) ON DELETE SET NULL;

ALTER TABLE tournament_matches 
  ADD CONSTRAINT tournament_matches_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES tournament_participants(id) ON DELETE SET NULL;

ALTER TABLE tournament_matches 
  ADD CONSTRAINT tournament_matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES tournament_participants(id) ON DELETE SET NULL;
