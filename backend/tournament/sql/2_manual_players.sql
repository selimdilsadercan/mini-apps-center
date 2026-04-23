-- Manuel oyuncu desteği için user_id alanını opsiyonel yapalım
ALTER TABLE tournament_participants ALTER COLUMN user_id DROP NOT NULL;

-- Manuel oyuncular için UNIQUE kısıtlamasını kaldıralım (Birden fazla null olabilmesi için)
ALTER TABLE tournament_participants DROP CONSTRAINT IF EXISTS tournament_participants_tournament_id_user_id_key;
