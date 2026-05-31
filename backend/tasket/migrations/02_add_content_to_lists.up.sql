-- Migration to add content field to lists
ALTER TABLE tasket.lists ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{"type": "doc", "content": []}'::jsonb;
ALTER TABLE tasket.lists ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure items are deleted when list is deleted
ALTER TABLE tasket.items DROP CONSTRAINT IF EXISTS items_list_id_fkey;
ALTER TABLE tasket.items ADD CONSTRAINT items_list_id_fkey FOREIGN KEY (list_id) REFERENCES tasket.lists(id) ON DELETE CASCADE;
