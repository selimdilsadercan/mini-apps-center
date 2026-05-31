-- Tasket Schema (Pages/Lists with Rich Content)
CREATE SCHEMA IF NOT EXISTS tasket;

-- Lists (now Pages) table
CREATE TABLE IF NOT EXISTS tasket.lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL,
    name TEXT NOT NULL,
    content JSONB DEFAULT '{"type": "doc", "content": []}'::jsonb,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table (Keeping for backward compatibility or individual quick tasks if needed, 
-- but primary content will be in lists.content)
CREATE TABLE IF NOT EXISTS tasket.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL,
    list_id UUID REFERENCES tasket.lists(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    item_type TEXT NOT NULL DEFAULT 'task' CHECK (item_type IN ('note', 'task')),
    color TEXT,
    reminder_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasket_lists_clerk_id ON tasket.lists(clerk_id);
CREATE INDEX IF NOT EXISTS idx_tasket_items_clerk_id ON tasket.items(clerk_id);
CREATE INDEX IF NOT EXISTS idx_tasket_items_list_id ON tasket.items(list_id);

-- Permissions
GRANT USAGE ON SCHEMA tasket TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA tasket TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tasket TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tasket TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasket GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasket GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasket GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
