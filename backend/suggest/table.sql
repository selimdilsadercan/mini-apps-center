-- Create suggest schema
CREATE SCHEMA IF NOT EXISTS suggest;

-- Suggestions table
CREATE TABLE IF NOT EXISTS suggest.suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    sender_clerk_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('song', 'movie', 'tv', 'video', 'place', 'book')),
    title TEXT NOT NULL,
    short_note TEXT,
    rating DECIMAL CHECK (rating >= 0 AND rating <= 5),
    external_link TEXT,
    image_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    reaction TEXT CHECK (reaction IN ('loved', 'skull', 'saved', 'mid', 'perfect')),
    is_daily_pick BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suggestion Recipients table
CREATE TABLE IF NOT EXISTS suggest.recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id UUID REFERENCES suggest.suggestions(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_clerk_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'saved', 'completed', 'ignored')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(suggestion_id, recipient_clerk_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_suggest_suggestions_sender ON suggest.suggestions(sender_clerk_id);
CREATE INDEX IF NOT EXISTS idx_suggest_recipients_recipient ON suggest.recipients(recipient_clerk_id);
CREATE INDEX IF NOT EXISTS idx_suggest_recipients_suggestion ON suggest.recipients(suggestion_id);
