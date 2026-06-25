-- Update get_user_preferences to return pinned_apps and last_used_apps
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
  last_used_apps JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT up.app_order, up.selected_university, up.is_onboarding_finished, up.pinned_apps, up.last_used_apps
  FROM public.user_preferences up
  JOIN public.users u ON up.user_id = u.id
  WHERE (is_local_param AND u.local_clerk_id = clerk_id_param)
     OR (NOT is_local_param AND u.clerk_id = clerk_id_param)
     OR (u.firebase_id = clerk_id_param);
END;
$$ LANGUAGE plpgsql;

-- Add update_user_preferences function
CREATE OR REPLACE FUNCTION public.update_user_preferences(
  clerk_id_param TEXT,
  app_order_param JSONB DEFAULT NULL,
  pinned_apps_param JSONB DEFAULT NULL,
  last_used_apps_param JSONB DEFAULT NULL,
  is_local_param BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user id
  SELECT id INTO v_user_id FROM public.users 
  WHERE (is_local_param AND local_clerk_id = clerk_id_param)
     OR (NOT is_local_param AND clerk_id = clerk_id_param)
     OR (firebase_id = clerk_id_param);
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.user_preferences (
    user_id, 
    app_order, 
    pinned_apps, 
    last_used_apps, 
    updated_at
  )
  VALUES (
    v_user_id, 
    COALESCE(app_order_param, '[]'::jsonb), 
    COALESCE(pinned_apps_param, '[]'::jsonb), 
    COALESCE(last_used_apps_param, '{}'::jsonb), 
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET 
    app_order = COALESCE(app_order_param, public.user_preferences.app_order),
    pinned_apps = COALESCE(pinned_apps_param, public.user_preferences.pinned_apps),
    last_used_apps = COALESCE(last_used_apps_param, public.user_preferences.last_used_apps),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.update_user_preferences(TEXT, JSONB, JSONB, JSONB, BOOLEAN) TO anon, authenticated, service_role;
