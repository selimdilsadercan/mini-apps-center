-- Bubilet Mehmet Akif Ersoy etkinliklerini workplaces.places kaydına bağla.
-- Önce: encore exec -- bun concert-list/cmd/import-mehmet-akif-and-link.ts

UPDATE concert_list.upcoming_concerts uc
SET
  place_id = p.id,
  venue = NULL
FROM workplaces.places p
WHERE uc.place_id IS NULL
  AND (
    p.url LIKE '%0x152ddd0ff278e83b:0x4da5a6c604550bb%'
    OR p.metadata->>'maps_ftid' = '0x152ddd0ff278e83b:0x4da5a6c604550bb'
    OR p.name ILIKE '%Mehmet Akif Ersoy%'
  )
  AND (
    uc.info_url LIKE '%soner-sarikabadayi-konseri%'
    OR uc.info_url LIKE '%kurk-mantolu-madonna%'
    OR uc.venue ILIKE '%Mehmet Akif Ersoy%'
  );

UPDATE campus_events.events e
SET location = p.name
FROM workplaces.places p
WHERE (
    p.url LIKE '%0x152ddd0ff278e83b:0x4da5a6c604550bb%'
    OR p.metadata->>'maps_ftid' = '0x152ddd0ff278e83b:0x4da5a6c604550bb'
    OR p.name ILIKE '%Mehmet Akif Ersoy%'
  )
  AND (
    e.title ILIKE '%Kürk Mantolu Madonna%'
    OR e.location ILIKE '%Mehmet Akif Ersoy%'
  );
