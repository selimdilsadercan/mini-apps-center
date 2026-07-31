-- Upcoming / attended konserleri scraper'ın eklediği KAFUM mekanına bağla.
-- Önce: encore exec -- bun workplaces/scrape/scrape-google-maps.ts --place "<kafum maps url>" --category activity --sync

UPDATE concert_list.upcoming_concerts uc
SET
  place_id = p.id,
  venue = NULL
FROM workplaces.places p
WHERE uc.place_id IS NULL
  AND (
    p.url LIKE '%0x152dddc7f4cdd1e1:0xe1093e16fb4f3db%'
    OR p.metadata->>'maps_ftid' = '0x152dddc7f4cdd1e1:0xe1093e16fb4f3db'
    OR p.name ILIKE '%KAFUM%'
    OR p.name ILIKE '%Fuar Merkezi%'
  )
  AND (
    uc.venue ILIKE '%KAFUM%'
    OR uc.venue ILIKE '%Fuar%'
    OR uc.description ILIKE '%Ağustos Fuarı%'
  );

UPDATE concert_list.concerts c
SET
  place_id = p.id,
  venue = NULL
FROM workplaces.places p
WHERE c.place_id IS NULL
  AND (
    p.url LIKE '%0x152dddc7f4cdd1e1:0xe1093e16fb4f3db%'
    OR p.metadata->>'maps_ftid' = '0x152dddc7f4cdd1e1:0xe1093e16fb4f3db'
    OR p.name ILIKE '%KAFUM%'
  )
  AND c.venue ILIKE '%KAFUM%';
