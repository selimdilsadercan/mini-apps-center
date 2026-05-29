-- Add self-referencing parent_id column for meme variations
ALTER TABLE memedex.memes
ADD COLUMN parent_id UUID REFERENCES memedex.memes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_memedex_memes_parent_id ON memedex.memes(parent_id);
