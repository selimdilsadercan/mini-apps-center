-- Pomodoro app schema
CREATE SCHEMA IF NOT EXISTS pomodoro;

-- We might want to track sessions in the future
CREATE TABLE IF NOT EXISTS pomodoro.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'work' or 'break'
    duration_minutes INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions
GRANT USAGE ON SCHEMA pomodoro TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA pomodoro TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA pomodoro TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA pomodoro TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pomodoro GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pomodoro GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pomodoro GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
