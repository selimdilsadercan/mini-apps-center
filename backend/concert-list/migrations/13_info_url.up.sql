-- Link concerts to external detail pages (e.g. official event calendar)
ALTER TABLE concert_list.concerts
  ADD COLUMN IF NOT EXISTS info_url TEXT;

ALTER TABLE concert_list.upcoming_concerts
  ADD COLUMN IF NOT EXISTS info_url TEXT;

-- Backfill August Fair concerts with official schedule URL
UPDATE concert_list.upcoming_concerts
SET info_url = 'https://kahramanmaras.bel.tr/duyuru/2026/07/24/geleneksel-agustos-fuari-etkinlik-takvimi'
WHERE info_url IS NULL
  AND (
    description ILIKE '%Ağustos Fuarı%'
    OR venue ILIKE '%KAFUM%'
    OR venue ILIKE '%Fuar%'
  );
