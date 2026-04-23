-- User Preferences: Table to store user-specific settings like app order
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  app_order JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to update or create user preferences
CREATE OR REPLACE FUNCTION update_user_app_order(
  clerk_id_param TEXT,
  app_order_param JSONB
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user id from clerk id
  SELECT id INTO v_user_id FROM users WHERE clerk_id = clerk_id_param;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO user_preferences (user_id, app_order, updated_at)
  VALUES (v_user_id, app_order_param, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    app_order = EXCLUDED.app_order,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get user preferences
CREATE OR REPLACE FUNCTION get_user_preferences(
  clerk_id_param TEXT
)
RETURNS TABLE (
  app_order JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT up.app_order
  FROM user_preferences up
  JOIN users u ON up.user_id = u.id
  WHERE u.clerk_id = clerk_id_param;
END;
$$ LANGUAGE plpgsql;
