-- Add business_id and category to campus_events.events
ALTER TABLE campus_events.events ADD COLUMN IF NOT EXISTS business_id TEXT REFERENCES business.businesses(id) ON DELETE CASCADE;
ALTER TABLE campus_events.events ADD COLUMN IF NOT EXISTS category TEXT;

-- Make university optional
ALTER TABLE campus_events.events ALTER COLUMN university DROP NOT NULL;

-- Index for business_id
CREATE INDEX IF NOT EXISTS idx_campus_events_events_business ON campus_events.events(business_id);
