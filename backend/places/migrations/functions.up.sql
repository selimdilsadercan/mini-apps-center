-- FUNCTIONS
-- 1. places.list_places
-- 2. places.get_place
-- 3. places.toggle_favorite
-- 4. places.add_place
-- 5. places.seed_places

-- 1. List Places
DROP FUNCTION IF EXISTS places.list_places(TEXT);
CREATE OR REPLACE FUNCTION places.list_places(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    address TEXT,
    district TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    image_url TEXT,
    rating NUMERIC,
    working_hours TEXT,
    features TEXT[],
    business_id TEXT,
    created_at TIMESTAMPTZ,
    is_favorite BOOLEAN
) AS $$
DECLARE
    v_user_id UUID := NULL;
BEGIN
    IF p_user_id IS NOT NULL AND p_user_id <> '' THEN
        v_user_id := public.get_internal_user_id(p_user_id);
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.address,
        p.district,
        p.latitude,
        p.longitude,
        p.image_url,
        p.rating,
        p.working_hours,
        p.features,
        p.business_id,
        p.created_at,
        CASE 
            WHEN v_user_id IS NOT NULL THEN EXISTS (
                SELECT 1 FROM places.user_favorites uf 
                WHERE uf.user_id = v_user_id AND uf.place_id = p.id
            )
            ELSE FALSE
        END AS is_favorite
    FROM places.places p
    ORDER BY p.rating DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Place
DROP FUNCTION IF EXISTS places.get_place(TEXT, UUID);
CREATE OR REPLACE FUNCTION places.get_place(p_user_id TEXT, p_place_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    address TEXT,
    district TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    image_url TEXT,
    rating NUMERIC,
    working_hours TEXT,
    features TEXT[],
    business_id TEXT,
    created_at TIMESTAMPTZ,
    is_favorite BOOLEAN
) AS $$
DECLARE
    v_user_id UUID := NULL;
BEGIN
    IF p_user_id IS NOT NULL AND p_user_id <> '' THEN
        v_user_id := public.get_internal_user_id(p_user_id);
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.address,
        p.district,
        p.latitude,
        p.longitude,
        p.image_url,
        p.rating,
        p.working_hours,
        p.features,
        p.business_id,
        p.created_at,
        CASE 
            WHEN v_user_id IS NOT NULL THEN EXISTS (
                SELECT 1 FROM places.user_favorites uf 
                WHERE uf.user_id = v_user_id AND uf.place_id = p.id
            )
            ELSE FALSE
        END AS is_favorite
    FROM places.places p
    WHERE p.id = p_place_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Toggle Favorite
DROP FUNCTION IF EXISTS places.toggle_favorite(TEXT, UUID);
CREATE OR REPLACE FUNCTION places.toggle_favorite(p_user_id TEXT, p_place_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    is_favorite BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
    v_is_fav BOOLEAN;
BEGIN
    v_user_id := public.get_internal_user_id(p_user_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM places.user_favorites 
        WHERE user_id = v_user_id AND place_id = p_place_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM places.user_favorites 
        WHERE user_id = v_user_id AND place_id = p_place_id;
        v_is_fav := FALSE;
    ELSE
        INSERT INTO places.user_favorites (user_id, place_id) 
        VALUES (v_user_id, p_place_id);
        v_is_fav := TRUE;
    END IF;

    RETURN QUERY SELECT TRUE, v_is_fav;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add Place
DROP FUNCTION IF EXISTS places.add_place(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT[], TEXT);
CREATE OR REPLACE FUNCTION places.add_place(
    p_name TEXT,
    p_description TEXT,
    p_category TEXT,
    p_address TEXT,
    p_district TEXT,
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_image_url TEXT,
    p_working_hours TEXT,
    p_features TEXT[],
    p_business_id TEXT
)
RETURNS places.places AS $$
DECLARE
    v_place places.places;
BEGIN
    INSERT INTO places.places (
        name, description, category, address, district, 
        latitude, longitude, image_url, working_hours, features, business_id
    ) VALUES (
        p_name, p_description, p_category, p_address, p_district,
        p_latitude, p_longitude, p_image_url, p_working_hours, p_features, p_business_id
    )
    RETURNING * INTO v_place;

    RETURN v_place;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed Places
DROP FUNCTION IF EXISTS places.seed_places();
CREATE OR REPLACE FUNCTION places.seed_places()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Delete existing seeded data to avoid duplicates
    DELETE FROM places.places WHERE name IN (
        'Espressolab Karaköy', 'Viyana Kahvesi Galata', 'Midpoint Kadıköy', 
        'Mangerie Bebek', 'Bebek Kahvesi', 'Tarihi Çınaraltı Aile Çay Bahçesi'
    );

    -- 1. Espressolab Karaköy
    INSERT INTO places.places (name, description, category, address, district, latitude, longitude, image_url, rating, working_hours, features, business_id)
    VALUES (
        'Espressolab Karaköy',
        'Karaköy''ün tarihi dokusunda, geniş oturma alanları ve harika nitelikli kahveleriyle hem çalışmak hem de sosyalleşmek için ideal bir mekan.',
        'Kafe',
        'Kemankeş Karamustafa Paşa, Rıhtım Cd. No:33, Beyoğlu/İstanbul',
        'Karaköy',
        41.0244,
        28.9786,
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80',
        4.6,
        '08:00 - 23:30',
        ARRAY['Hızlı Wi-Fi', 'Priz Bulunur', 'Açık Alan', 'Çalışmaya Uygun'],
        (SELECT id FROM business.businesses WHERE id = 'kanlica' LIMIT 1) -- Linked to mock business if exists
    );
    v_count := v_count + 1;

    -- 2. Viyana Kahvesi Galata
    INSERT INTO places.places (name, description, category, address, district, latitude, longitude, image_url, rating, working_hours, features, business_id)
    VALUES (
        'Viyana Kahvesi Galata',
        'Meşhur San Sebastian cheesecake''i ve enfes Viyana usulü kahveleriyle Galata Kulesi manzaralı eşsiz bir durak.',
        'Tatlıcı',
        'Bereketzade, Büyük Hendek Cd. No:19/A, Beyoğlu/İstanbul',
        'Galata',
        41.0260,
        28.9743,
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
        4.7,
        '09:00 - 23:00',
        ARRAY['Açık Alan', 'Manzara', 'Tatlı Odaklı'],
        NULL
    );
    v_count := v_count + 1;

    -- 3. Midpoint Kadıköy
    INSERT INTO places.places (name, description, category, address, district, latitude, longitude, image_url, rating, working_hours, features, business_id)
    VALUES (
        'Midpoint Kadıköy',
        'Moda sahilinde, zengin dünya mutfağı menüsü ve geniş alkollü/alkolsüz içecek yelpazesi ile günün her saati keyifli vakit geçirebileceğiniz bir restoran.',
        'Restoran',
        'Caferağa, Moda Cd. No:122, Kadıköy/İstanbul',
        'Kadıköy',
        40.9856,
        29.0250,
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
        4.4,
        '09:00 - 00:00',
        ARRAY['Açık Alan', 'Otopark', 'Geniş Menü', 'Alkol'],
        NULL
    );
    v_count := v_count + 1;

    -- 4. Mangerie Bebek
    INSERT INTO places.places (name, description, category, address, district, latitude, longitude, image_url, rating, working_hours, features, business_id)
    VALUES (
        'Mangerie Bebek',
        'Boğaz manzaralı terasında eşsiz kahvaltı seçenekleri ve fine-dining kalitesindeki akşam yemeği menüsüyle Bebek''in en popüler noktalarından biri.',
        'Restoran',
        'Bebek, Cevdet Paşa Cd. No:69, Beşiktaş/İstanbul',
        'Bebek',
        41.0772,
        29.0436,
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop&q=80',
        4.5,
        '08:00 - 00:00',
        ARRAY['Boğaz Manzarası', 'Açık Alan', 'Kahvaltı', 'Rezervasyon Önerilir'],
        NULL
    );
    v_count := v_count + 1;

    -- 5. Bebek Kahvesi
    INSERT INTO places.places (name, description, category, address, district, latitude, longitude, image_url, rating, working_hours, features, business_id)
    VALUES (
        'Bebek Kahvesi',
        '1945''ten beri Bebek parkının hemen yanında, denize sıfır çay-kahve keyfi yapabileceğiniz, nostaljik ve samimi semt kahvesi.',
        'Kafe',
        'Bebek, Cevdet Paşa Cd. No:38/A, Beşiktaş/İstanbul',
        'Bebek',
        41.0768,
        29.0431,
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
        4.3,
        '07:00 - 22:00',
        ARRAY['Deniz Kenarı', 'Açık Alan', 'Klasik Lezzetler'],
        NULL
    );
    v_count := v_count + 1;

    -- 6. Tarihi Çınaraltı Aile Çay Bahçesi
    INSERT INTO places.places (name, description, category, address, district, latitude, longitude, image_url, rating, working_hours, features, business_id)
    VALUES (
        'Tarihi Çınaraltı Aile Çay Bahçesi',
        'Çengelköy sahilde, asırlık çınar ağacının gölgesinde, dışarıdan yiyecek getirmenin serbest olduğu ikonik boğaz çay bahçesi.',
        'Kafe',
        'Çengelköy, Çengelköy Cd. No:4, Üsküdar/İstanbul',
        'Çengelköy',
        41.0506,
        29.0522,
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
        4.5,
        '24 Saat Açık',
        ARRAY['Boğaz Manzarası', 'Deniz Kenarı', 'Açık Alan', '24 Saat Açık'],
        NULL
    );
    v_count := v_count + 1;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
