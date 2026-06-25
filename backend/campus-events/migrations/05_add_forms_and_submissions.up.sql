-- Add form fields to events table
ALTER TABLE campus_events.events ADD COLUMN IF NOT EXISTS has_form BOOLEAN DEFAULT FALSE;
ALTER TABLE campus_events.events ADD COLUMN IF NOT EXISTS form_questions JSONB DEFAULT '[]'::jsonb;

-- Create submissions table
CREATE TABLE IF NOT EXISTS campus_events.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES campus_events.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);

-- Index for submissions
CREATE INDEX IF NOT EXISTS idx_campus_events_submissions_event ON campus_events.submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_campus_events_submissions_user ON campus_events.submissions(user_id);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA campus_events TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA campus_events TO anon, authenticated, service_role;
