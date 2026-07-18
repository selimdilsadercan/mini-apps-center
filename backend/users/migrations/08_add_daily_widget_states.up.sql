-- Add daily_widget_states to user_preferences
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'daily_widget_states'
    ) THEN
        ALTER TABLE public.user_preferences ADD COLUMN daily_widget_states JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Update get_user_preferences to return daily_widget_states
DROP FUNCTION IF EXISTS public.get_user_preferences(TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.get_user_preferences(
  clerk_id_param TEXT,
  is_local_param BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  app_order JSONB,
  selected_university TEXT,
  is_onboarding_finished BOOLEAN,
  pinned_apps JSONB,
  last_used_apps JSONB,
  usageCounts JSONB,
  daily_widget_states JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT up.app_order, up.selected_university, up.is_onboarding_finished, up.pinned_apps, up.last_used_apps, up.usage_counts, up.daily_widget_states
  FROM public.user_preferences up
  JOIN public.users u ON up.user_id = u.id
  WHERE (is_local_param AND u.local_clerk_id = clerk_id_param)
     OR (NOT is_local_param AND u.clerk_id = clerk_id_param)
     OR (u.firebase_id = clerk_id_param);
END;
$$ LANGUAGE plpgsql;

-- Update update_user_preferences to handle daily_widget_states
DROP FUNCTION IF EXISTS public.update_user_preferences(TEXT, JSONB, JSONB, JSONB, JSONB, BOOLEAN);
DROP FUNCTION IF EXISTS public.update_user_preferences(TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, BOOLEAN);

CREATE OR REPLACE FUNCTION public.update_user_preferences(
  clerk_id_param TEXT,
  app_order_param JSONB DEFAULT NULL,
  pinned_apps_param JSONB DEFAULT NULL,
  last_used_apps_param JSONB DEFAULT NULL,
  usage_counts_param JSONB DEFAULT NULL,
  daily_widget_states_param JSONB DEFAULT NULL,
  is_local_param BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users 
  WHERE (is_local_param AND local_clerk_id = clerk_id_param)
     OR (NOT is_local_param AND clerk_id = clerk_id_param)
     OR (firebase_id = clerk_id_param);
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.user_preferences (
    user_id, app_order, pinned_apps, last_used_apps, usage_counts, daily_widget_states, updated_at
  ) VALUES (
    v_user_id,
    COALESCE(app_order_param, '[]'::jsonb),
    COALESCE(pinned_apps_param, '[]'::jsonb),
    COALESCE(last_used_apps_param, '{}'::jsonb),
    COALESCE(usage_counts_param, '{}'::jsonb),
    COALESCE(daily_widget_states_param, '{}'::jsonb),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    app_order = COALESCE(app_order_param, public.user_preferences.app_order),
    pinned_apps = COALESCE(pinned_apps_param, public.user_preferences.pinned_apps),
    last_used_apps = COALESCE(last_used_apps_param, public.user_preferences.last_used_apps),
    usage_counts = COALESCE(usage_counts_param, public.user_preferences.usage_counts),
    daily_widget_states = COALESCE(daily_widget_states_param, public.user_preferences.daily_widget_states),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_user_preferences(TEXT, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_user_preferences(TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, BOOLEAN) TO anon, authenticated, service_role;
