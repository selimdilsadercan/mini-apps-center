-- Migration to add assignee and due_date to items
ALTER TABLE tasket.items ADD COLUMN IF NOT EXISTS assignee TEXT;
ALTER TABLE tasket.items ADD COLUMN IF NOT EXISTS due_date DATE;

-- Index for due_date to support "Today's Tasks"
CREATE INDEX IF NOT EXISTS idx_tasket_items_due_date ON tasket.items(due_date);
