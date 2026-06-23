-- Add contact_info to businesses table
ALTER TABLE business.businesses ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}'::jsonb;
