-- Add header_url to businesses table
ALTER TABLE business.businesses ADD COLUMN IF NOT EXISTS header_url TEXT;
