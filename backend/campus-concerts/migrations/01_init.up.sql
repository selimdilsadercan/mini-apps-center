-- Create Schema
CREATE SCHEMA IF NOT EXISTS campus_concerts;

-- Campus Concerts Table
CREATE TABLE IF NOT EXISTS campus_concerts.concerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist TEXT NOT NULL,
    campus TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    image_url TEXT,
    added_by_clerk_id TEXT REFERENCES public.users(clerk_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS campus_concerts.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_clerk_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    concert_id UUID NOT NULL REFERENCES campus_concerts.concerts(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('went', 'going', 'interested')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_clerk_id, concert_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campus_concerts_campus ON campus_concerts.concerts(campus);
CREATE INDEX IF NOT EXISTS idx_campus_concerts_date ON campus_concerts.concerts(date);
CREATE INDEX IF NOT EXISTS idx_campus_attendance_user ON campus_concerts.attendance(user_clerk_id);
CREATE INDEX IF NOT EXISTS idx_campus_attendance_concert ON campus_concerts.attendance(concert_id);

-- Schema and Table Permissions (Grants)
GRANT USAGE ON SCHEMA campus_concerts TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA campus_concerts TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA campus_concerts TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA campus_concerts TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_concerts GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_concerts GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_concerts GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Seed Data: İTÜ Concerts
INSERT INTO campus_concerts.concerts (artist, campus, date, description) VALUES
('Arem Arman', 'İTÜ Ayazağa', '2026-05-10', 'İTÜ Fest 2026 Kapanış'),
('Pinhani', 'İTÜ Ayazağa', '2026-05-10', 'İTÜ Fest 2026'),
('Fatma Turgut', 'İTÜ Ayazağa', '2026-05-09', 'İTÜ Fest 2026 Ana Sahne'),
('Motive', 'İTÜ Ayazağa', '2026-05-08', 'İTÜ Fest 2026 Hip Hop Gecesi'),
('Madrigal', 'İTÜ Ayazağa', '2025-10-18', 'Güz Dönemi Başlangıç Konseri'),
('Emre Fel', 'İTÜ Ayazağa', '2025-10-16', 'İTÜ Back to School'),
('Justin Timberlake', 'İTÜ Ayazağa', '2025-07-30', 'Dünya Turnesi İstanbul Ayağı - İTÜ Stadyumu'),
('Ufuk Beydemir', 'İTÜ Ayazağa', '2025-06-01', 'İTÜ Mezuniyet Töreni Konseri'),
('Redd', 'İTÜ Ayazağa', '2025-05-19', '19 Mayıs Atatürk''ü Anma, Gençlik ve Spor Bayramı Konseri'),
('Belki Biraz', 'İTÜ Ayazağa', '2025-05-08', 'İTÜ Fest 2025 Alternatif Sahne'),
('Sertab Erener', 'İTÜ Ayazağa', '2024-12-19', 'İTÜ Kış Konseri'),
('M Lisa', 'İTÜ Ayazağa', '2024-10-18', 'İTÜ Güz Şenliği'),
('Ceza', 'İTÜ Ayazağa', '2024-05-25', 'İTÜ Fest 2024 Ana Sahne'),
('Cem Adrian', 'İTÜ Ayazağa', '2024-05-24', 'İTÜ Fest 2024'),
('MFÖ', 'İTÜ Ayazağa', '2024-05-23', 'İTÜ Fest 2024 Açılış Konseri'),
('Mavi Gri', 'İTÜ Ayazağa', '2024-05-05', 'Bahar Şenliği Ön Etkinliği'),
('Reynmen', 'İTÜ Ayazağa', '2022-06-23', 'Yaz Şenliği 2022'),
('Bege', 'İTÜ Ayazağa', '2022-06-23', 'Yaz Şenliği 2022'),
('Güneş', 'İTÜ Ayazağa', '2022-10-06', 'Güz Şenliği 2022'),
('İsa Özkocaman', 'İTÜ Ayazağa', '2022-05-21', 'İTÜ Fest 2022'),
('Seksendört', 'İTÜ Ayazağa', '2022-05-21', 'İTÜ Fest 2022 Ana Sahne'),
('Merve Özbey', 'İTÜ Ayazağa', '2021-10-28', 'Cumhuriyet Bayramı Konseri'),
('Metallica', 'İTÜ Ayazağa', '2014-07-13', 'Metallica By Request turnesi kapsamında hayranların seçtiği şarkıların çalındığı, Pentagram''ın ön grup olarak sahne aldığı efsane İTÜ Stadyumu konseri.'),
('Lady Gaga', 'İTÜ Ayazağa', '2014-09-16', 'artRAVE: the ARTPOP Ball turnesi kapsamında dev sahne prodüksiyonu ve Lady Gaga''nın İTÜ Maslak Kampüsü''nü sallayan muhteşem şovu.'),
('Justin Timberlake', 'İTÜ Ayazağa', '2014-05-26', 'The 20/20 Experience World Tour kapsamında ilk kez Türkiye''ye gelen Timberlake''in Soma madencilerini andığı unutulmaz İTÜ Stadyumu konseri.'),
('Justin Bieber', 'İTÜ Ayazağa', '2013-05-02', 'Believe Tour kapsamında İTÜ vizeleri döneminde gerçekleşen, kampüste büyük hareketlilik yaratan olaylı pop konseri.'),
('Roger Waters', 'İTÜ Ayazağa', '2013-08-04', 'Pink Floyd efsanesinin The Wall turnesi kapsamında 120 metrelik dev projeksiyon duvarıyla sunduğu, 40.000 kişinin katıldığı tarihi şov.'),
('Pharrell Williams', 'İTÜ Ayazağa', '2014-09-07', 'GNCFEST kapsamında Pharrell Williams, Inna, Rita Ora, MaNga, Model ve Mabel Matiz''in sahne aldığı dev gençlik festivali.');

-- Seed Data: Boğaziçi Concerts
INSERT INTO campus_concerts.concerts (artist, campus, date, description) VALUES
('Duman', 'Boğaziçi Güney Kampüs', '2026-05-15', 'Boğaziçi Taşoda Şenliği 2026'),
('Mor ve Ötesi', 'Boğaziçi Güney Kampüs', '2026-05-16', 'Boğaziçi Taşoda Şenliği 2026'),
('Adamlar', 'Boğaziçi Güney Kampüs', '2026-05-17', 'Boğaziçi Spor Şenliği Kapanış Konseri'),
('Yüzyüzeyken Konuşuruz', 'Boğaziçi Güney Kampüs', '2025-10-12', 'Boğaziçi Mezunlar Günü'),
('Dolu Kadehi Ters Tut', 'Boğaziçi Güney Kampüs', '2024-05-10', 'Taşoda Konserleri'),
('Gripin', 'Boğaziçi Güney Kampüs', '2024-05-09', 'Boğaziçi Bahar Şenliği'),
('Manga', 'Boğaziçi Güney Kampüs', '2022-05-14', 'Boğaziçi Spor Şenliği 2022');

-- Functions (RPC)
DROP FUNCTION IF EXISTS campus_concerts.get_concerts(TEXT);
CREATE OR REPLACE FUNCTION campus_concerts.get_concerts(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    artist TEXT,
    campus TEXT,
    date DATE,
    description TEXT,
    image_url TEXT,
    added_by_clerk_id TEXT,
    creator_username TEXT,
    creator_avatar TEXT,
    created_at TIMESTAMPTZ,
    user_status TEXT,
    attendees JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.artist,
        c.campus,
        c.date,
        c.description,
        c.image_url,
        c.added_by_clerk_id,
        cu.username AS creator_username,
        cu.avatar_url AS creator_avatar,
        c.created_at,
        (
            SELECT att.status 
            FROM campus_concerts.attendance att 
            WHERE att.concert_id = c.id AND att.user_clerk_id = clerk_id_param
        ) AS user_status,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'clerk_id', u.clerk_id,
                        'username', u.username,
                        'avatar_url', u.avatar_url,
                        'status', att.status
                    )
                )
                FROM campus_concerts.attendance att
                JOIN public.users u ON att.user_clerk_id = u.clerk_id
                WHERE att.concert_id = c.id
            ),
            '[]'::jsonb
        ) AS attendees
    FROM campus_concerts.concerts c
    LEFT JOIN public.users cu ON c.added_by_clerk_id = cu.clerk_id
    ORDER BY c.date DESC, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS campus_concerts.add_concert(TEXT, TEXT, DATE, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION campus_concerts.add_concert(
    artist_param TEXT,
    campus_param TEXT,
    date_param DATE,
    description_param TEXT,
    image_url_param TEXT,
    added_by_clerk_id_param TEXT
)
RETURNS TABLE (
    id UUID,
    artist TEXT,
    campus TEXT,
    date DATE,
    description TEXT,
    image_url TEXT,
    added_by_clerk_id TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO campus_concerts.concerts (
        artist,
        campus,
        date,
        description,
        image_url,
        added_by_clerk_id
    ) VALUES (
        artist_param,
        campus_param,
        date_param,
        description_param,
        image_url_param,
        added_by_clerk_id_param
    )
    RETURNING 
        campus_concerts.concerts.id,
        campus_concerts.concerts.artist,
        campus_concerts.concerts.campus,
        campus_concerts.concerts.date,
        campus_concerts.concerts.description,
        campus_concerts.concerts.image_url,
        campus_concerts.concerts.added_by_clerk_id,
        campus_concerts.concerts.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS campus_concerts.set_attendance(TEXT, UUID, TEXT);
CREATE OR REPLACE FUNCTION campus_concerts.set_attendance(
    clerk_id_param TEXT,
    concert_id_param UUID,
    status_param TEXT
)
RETURNS TABLE (
    id UUID,
    user_clerk_id TEXT,
    concert_id UUID,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    IF status_param IS NULL OR status_param = 'none' OR status_param = '' THEN
        RETURN QUERY
        DELETE FROM campus_concerts.attendance
        WHERE user_clerk_id = clerk_id_param AND concert_id = concert_id_param
        RETURNING 
            campus_concerts.attendance.id,
            campus_concerts.attendance.user_clerk_id,
            campus_concerts.attendance.concert_id,
            campus_concerts.attendance.status,
            campus_concerts.attendance.created_at;
    ELSE
        RETURN QUERY
        INSERT INTO campus_concerts.attendance (
            user_clerk_id,
            concert_id,
            status
        ) VALUES (
            clerk_id_param,
            concert_id_param,
            status_param
        )
        ON CONFLICT (user_clerk_id, concert_id)
        DO UPDATE SET 
            status = EXCLUDED.status,
            created_at = NOW()
        RETURNING 
            campus_concerts.attendance.id,
            campus_concerts.attendance.user_clerk_id,
            campus_concerts.attendance.concert_id,
            campus_concerts.attendance.status,
            campus_concerts.attendance.created_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

