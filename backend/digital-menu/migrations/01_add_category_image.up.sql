-- Add image_url to categories table
ALTER TABLE digital_menu.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
