-- Turnuva ayarlarını güncelle
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS players_per_match INTEGER DEFAULT 2;

-- Maç tablosunu 4 kişiyi destekleyecek şekilde genişlet
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS player3_id UUID REFERENCES users(id);
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS player4_id UUID REFERENCES users(id);
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS score3 INTEGER DEFAULT 0;
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS score4 INTEGER DEFAULT 0;

-- Katılımcı tablosunda user_id'yi opsiyonel yap (Manuel oyuncular için)
ALTER TABLE tournament_participants ALTER COLUMN user_id DROP NOT NULL;

-- Maç tablosunda oyuncu referanslarını opsiyonel yap (Mock/Manuel oyuncular için)
ALTER TABLE tournament_matches ALTER COLUMN player1_id DROP NOT NULL;
ALTER TABLE tournament_matches ALTER COLUMN player2_id DROP NOT NULL;
