-- planned = gitmek istiyorum, attended = gittim / listem
ALTER TABLE concert_list.concerts
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'attended'
    CHECK (status IN ('planned', 'attended'));

ALTER TABLE concert_list.concerts
  ADD COLUMN IF NOT EXISTS upcoming_concert_id UUID
    REFERENCES concert_list.upcoming_concerts(id) ON DELETE SET NULL;

UPDATE concert_list.concerts SET status = 'attended' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_concerts_status ON concert_list.concerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_concerts_upcoming_concert_id ON concert_list.concerts(upcoming_concert_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_concerts_user_planned_upcoming
  ON concert_list.concerts(user_id, upcoming_concert_id)
  WHERE status = 'planned' AND upcoming_concert_id IS NOT NULL;
