-- Drop functions
DROP FUNCTION IF EXISTS subcenter.get_global_presets(INTEGER);
DROP FUNCTION IF EXISTS subcenter.upsert_global_preset(TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT);

-- Drop table
DROP TABLE IF EXISTS subcenter.global_presets;
