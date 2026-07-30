-- Add Tarhana & Firik places as requested by user
DO $$ 
BEGIN
    -- 1. Sarıgül - Hürriyet
    IF NOT EXISTS (SELECT 1 FROM workplaces.places WHERE name ILIKE 'Sarıgül - Hürriyet' OR url LIKE '%0x152ddd02c48e0ef9:0x62b4fb8ca80ca5e6%') THEN
        INSERT INTO workplaces.places (name, url, tags, latitude, longitude, district, approved, city, types)
        VALUES ('Sarıgül - Hürriyet', 
                'https://www.google.com/maps/place/Sar%C4%B1g%C3%BCl+%C4%B0mamo%C4%9Flu+Tarhana+Firik/@37.586233,36.8743128,14.64z/data=!4m10!1m2!2m1!1zc2FyxLFnw7xs!3m6!1s0x152ddd02c48e0ef9:0x62b4fb8ca80ca5e6!8m2!3d37.5937497!4d36.8961911',
                ARRAY['firik', 'tarhana'], 37.5937497, 36.8961911, 'Hürriyet', TRUE, 'kahramanmaras', ARRAY['complex']);
    END IF;

    -- 2. Sarıgül - Süleymanşah
    IF NOT EXISTS (SELECT 1 FROM workplaces.places WHERE name ILIKE 'Sarıgül - Süleymanşah' OR url LIKE '%0x152ddb3f28398f6f:0x3a70d56c57194647%') THEN
        INSERT INTO workplaces.places (name, url, tags, latitude, longitude, district, approved, city, types)
        VALUES ('Sarıgül - Süleymanşah', 
                'https://www.google.com/maps/place/Sar%C4%B1g%C3%BCl/@37.5918632,36.838853,14.64z/data=!4m10!1m2!2m1!1zc2FyxLFnw7xs!3m6!1s0x152ddb3f28398f6f:0x3a70d56c57194647!8m2!3d37.5980578!4d36.8554658',
                ARRAY['firik', 'tarhana'], 37.5980578, 36.8554658, 'Süleymanşah', TRUE, 'kahramanmaras', ARRAY['complex']);
    END IF;

    -- 3. Sarıgül İmamoğlu - Haydar Bey
    IF NOT EXISTS (SELECT 1 FROM workplaces.places WHERE name ILIKE 'Sarıgül İmamoğlu - Haydar Bey' OR url LIKE '%0x152ddb89e3000001:0x7026c7c43115d9bd%') THEN
        INSERT INTO workplaces.places (name, url, tags, latitude, longitude, district, approved, city, types)
        VALUES ('Sarıgül İmamoğlu - Haydar Bey', 
                'https://www.google.com/maps/place/Sar%C4%B1g%C3%BCl+%C4%B0mamo%C4%9Flu+Firik+Tarhana/@37.5832697,36.8408509,14.3z/data=!3m1!5s0x152ddb89e3620fa3:0x380ba78a36464c51!4m10!1m2!2m1!1zc2FyxLFnw7xs!3m6!1s0x152ddb89e3000001:0x7026c7c43115d9bd!8m2!3d37.5841481!4d36.8669465',
                ARRAY['firik', 'tarhana'], 37.5841481, 36.8669465, 'Haydar Bey', TRUE, 'kahramanmaras', ARRAY['complex']);
    END IF;

    -- 4. Çömezoğlu Tarhana & Firik
    IF NOT EXISTS (SELECT 1 FROM workplaces.places WHERE name ILIKE '%Çömezoğlu%' OR url LIKE '%0x152ddcf62d3249b1:0xd9d459b4051bd59b%') THEN
        INSERT INTO workplaces.places (name, url, tags, latitude, longitude, district, approved, city, types)
        VALUES ('Çömezoğlu Tarhana & Firik', 
                'https://www.google.com/maps/place/%C3%87%C3%B6mezo%C4%9Flu+Tarhana+%26+Firik/@37.5884248,36.8508697,14z/data=!4m10!1m2!2m1!1sfirik!3m6!1s0x152ddcf62d3249b1:0xd9d459b4051bd59b!8m2!3d37.58842!4d36.8889802',
                ARRAY['firik', 'tarhana'], 37.58842, 36.8889802, 'Dulkadiroğlu', TRUE, 'kahramanmaras', ARRAY['complex']);
    END IF;

    -- 5. Günal Firik ve Tarhana
    IF NOT EXISTS (SELECT 1 FROM workplaces.places WHERE name ILIKE '%Günal%' OR url LIKE '%0x152ddc820dca1b83:0x4709af5678423b2b%') THEN
        INSERT INTO workplaces.places (name, url, tags, latitude, longitude, district, approved, city, types)
        VALUES ('Günal Firik ve Tarhana', 
                'https://www.google.com/maps/place/G%C3%BCnal+Firik+ve+Tarhana/@37.5908733,36.8385959,14z/data=!4m10!1m2!2m1!1sfirik!3m6!1s0x152ddc820dca1b83:0x4709af5678423b2b!8m2!3d37.6024919!4d36.8686031',
                ARRAY['firik', 'tarhana'], 37.6024919, 36.8686031, 'Onikişubat', TRUE, 'kahramanmaras', ARRAY['complex']);
    END IF;

    -- 6. Htd Tarhana Firik
    IF NOT EXISTS (SELECT 1 FROM workplaces.places WHERE name ILIKE '%Htd%' OR url LIKE '%0x152ddd614ae0b5b5:0x68ea725ed24f51a9%') THEN
        INSERT INTO workplaces.places (name, url, tags, latitude, longitude, district, approved, city, types)
        VALUES ('Htd Tarhana Firik', 
                'https://www.google.com/maps/place/Htd+Tarhana+Firik/@37.5921362,36.8702996,14.57z/data=!4m10!1m2!2m1!1sfirik!3m6!1s0x152ddd614ae0b5b5:0x68ea725ed24f51a9!8m2!3d37.59351!4d36.8968379',
                ARRAY['firik', 'tarhana'], 37.59351, 36.8968379, 'Dulkadiroğlu', TRUE, 'kahramanmaras', ARRAY['complex']);
    END IF;

    -- 7. Şitar Tarhana
    IF NOT EXISTS (SELECT 1 FROM workplaces.places WHERE name ILIKE '%Şitar%' OR url LIKE '%0x152ddd091f395dcb:0x398897f256bc5734%') THEN
        INSERT INTO workplaces.places (name, url, tags, latitude, longitude, district, approved, city, types)
        VALUES ('Şitar Tarhana', 
                'https://www.google.com/maps/place/%C5%9Eitar+Tarhana/@37.5869397,36.8777212,17z/data=!3m1!4b1!4m6!3m5!1s0x152ddd091f395dcb:0x398897f256bc5734!8m2!3d37.5869397!4d36.8802961',
                ARRAY['firik', 'tarhana'], 37.5869397, 36.8802961, 'Dulkadiroğlu', TRUE, 'kahramanmaras', ARRAY['complex']);
    END IF;

    -- 8. Osmanoğlu - Alparslan Türkeş
    IF NOT EXISTS (SELECT 1 FROM workplaces.places WHERE name ILIKE 'Osmanoğlu - Alparslan Türkeş' OR url LIKE '%0x152dddc0bab3265b:0x83cb8a97a2f7c832%') THEN
        INSERT INTO workplaces.places (name, url, tags, latitude, longitude, district, approved, city, types)
        VALUES ('Osmanoğlu - Alparslan Türkeş', 
                'https://www.google.com/maps/place/Osmano%C4%9Flu+tarhana/@37.5869392,36.8699964,15z/data=!4m10!1m2!2m1!1sosmano%C4%9Flu!3m6!1s0x152dddc0bab3265b:0x83cb8a97a2f7c832!8m2!3d37.5887003!4d36.8837867',
                ARRAY['firik', 'tarhana'], 37.5887003, 36.8837867, 'Haydar Bey', TRUE, 'kahramanmaras', ARRAY['complex']);
    END IF;
END $$;
