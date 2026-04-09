-- User FCM Tokens: Manage multiple devices for notifications
CREATE TABLE IF NOT EXISTS user_fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_type TEXT, -- 'web', 'ios', 'android'
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clerk_id, fcm_token)
);

CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_clerk_id ON user_fcm_tokens(clerk_id);
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_token ON user_fcm_tokens(fcm_token);
