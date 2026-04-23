-- Maç tablosuna esnek skor alanı ekle
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS scores JSONB DEFAULT '{}'::jsonb;

-- player3 ve player4 referanslarını tournament_participants tablosuna yönlendir (önceki hata düzeltmesi)
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_player3_id_fkey;
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_player4_id_fkey;

-- Not: player_id'ler artık hem users hem de tournament_participants'ten gelebildiği için 
-- kısıtlamaları kaldırmak veya daha esnek bir yapı kurmak gerekebilir. 
-- Şimdilik manuel oyuncu desteği için kısıtlamaları kaldırıyoruz.
