-- 1. users_create_user
DROP FUNCTION IF EXISTS public.users_create_user(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.users_create_user(TEXT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.users_create_user(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION public.users_create_user(
  clerk_id_param TEXT,
  username_param TEXT DEFAULT NULL,
  avatar_url_param TEXT DEFAULT NULL,
  full_name_param TEXT DEFAULT NULL,
  is_local_param BOOLEAN DEFAULT FALSE,
  firebase_id_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Check if user already exists (Prioritize firebase_id lookup if provided)
  IF firebase_id_param IS NOT NULL THEN
    SELECT u.id INTO v_user_id FROM public.users u WHERE u.firebase_id = firebase_id_param;
  END IF;

  IF v_user_id IS NULL THEN
    IF is_local_param THEN
      SELECT u.id INTO v_user_id FROM public.users u WHERE u.local_clerk_id = clerk_id_param;
    ELSE
      SELECT u.id INTO v_user_id FROM public.users u WHERE u.clerk_id = clerk_id_param;
    END IF;
  END IF;

  -- 2. If exists, update (and associate firebase_id if it's missing)
  IF v_user_id IS NOT NULL THEN
    UPDATE public.users u
    SET 
      username = COALESCE(username_param, u.username),
      full_name = COALESCE(full_name_param, u.full_name),
      avatar_url = COALESCE(avatar_url_param, u.avatar_url),
      firebase_id = COALESCE(firebase_id_param, u.firebase_id)
    WHERE u.id = v_user_id;
  ELSE
    -- 3. If not exists, insert new user
    IF is_local_param THEN
      -- On local, clerk_id is NOT NULL so we; set both clerk_id and local_clerk_id to clerk_id_param
      INSERT INTO public.users (clerk_id, local_clerk_id, firebase_id, username, avatar_url, full_name)
      VALUES (clerk_id_param, clerk_id_param, firebase_id_param, username_param, avatar_url_param, full_name_param)
      RETURNING public.users.id INTO v_user_id;
    ELSE
      INSERT INTO public.users (clerk_id, firebase_id, username, avatar_url, full_name)
      VALUES (clerk_id_param, firebase_id_param, username_param, avatar_url_param, full_name_param)
      RETURNING public.users.id INTO v_user_id;
    END IF;
  END IF;

  RETURN QUERY
  SELECT u.id, u.username, u.full_name, u.avatar_url, u.created_at
  FROM public.users u
  WHERE u.id = v_user_id;
END;
$$;

-- 2. users_get_user
DROP FUNCTION IF EXISTS public.users_get_user(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.users_get_user(TEXT, BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION public.users_get_user(
  clerk_id_param TEXT,
  is_local_param BOOLEAN DEFAULT FALSE,
  firebase_id_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    username,
    full_name,
    avatar_url,
    created_at
  FROM public.users
  WHERE (firebase_id_param IS NOT NULL AND firebase_id = firebase_id_param)
     OR (is_local_param AND local_clerk_id = clerk_id_param)
     OR (NOT is_local_param AND clerk_id = clerk_id_param)
  LIMIT 1;
$$;

-- 3. users_get_user_by_username
DROP FUNCTION IF EXISTS public.users_get_user_by_username;

CREATE OR REPLACE FUNCTION public.users_get_user_by_username(username_param TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    username,
    full_name,
    avatar_url,
    created_at
  FROM public.users
  WHERE LOWER(username) = LOWER(username_param)
  LIMIT 1;
$$;

-- 4. is_admin
DROP FUNCTION IF EXISTS public.is_admin(TEXT);
DROP FUNCTION IF EXISTS public.is_admin(TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.is_admin(
  p_clerk_id TEXT,
  is_local_param BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT role = 'admin' FROM public.users 
         WHERE (is_local_param AND local_clerk_id = p_clerk_id)
            OR (NOT is_local_param AND clerk_id = p_clerk_id)
            OR (firebase_id = p_clerk_id)
         LIMIT 1),
        FALSE
    );
$$;

-- 5. update_user_app_order
DROP FUNCTION IF EXISTS public.update_user_app_order;

CREATE OR REPLACE FUNCTION public.update_user_app_order(
  clerk_id_param TEXT,
  app_order_param JSONB,
  is_local_param BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user id from clerk id (checking environment specific ID or firebase_id)
  SELECT id INTO v_user_id FROM public.users 
  WHERE (is_local_param AND local_clerk_id = clerk_id_param)
     OR (NOT is_local_param AND clerk_id = clerk_id_param)
     OR (firebase_id = clerk_id_param);
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.user_preferences (user_id, app_order, updated_at)
  VALUES (v_user_id, app_order_param, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    app_order = EXCLUDED.app_order,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. get_user_preferences
DROP FUNCTION IF EXISTS public.get_user_preferences;

CREATE OR REPLACE FUNCTION public.get_user_preferences(
  clerk_id_param TEXT,
  is_local_param BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  app_order JSONB,
  selected_university TEXT,
  is_onboarding_finished BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT up.app_order, up.selected_university, up.is_onboarding_finished
  FROM public.user_preferences up
  JOIN public.users u ON up.user_id = u.id
  WHERE (is_local_param AND u.local_clerk_id = clerk_id_param)
     OR (NOT is_local_param AND u.clerk_id = clerk_id_param)
     OR (u.firebase_id = clerk_id_param);
END;
$$ LANGUAGE plpgsql;

-- 6a. update_onboarding_finished
DROP FUNCTION IF EXISTS public.update_onboarding_finished;

CREATE OR REPLACE FUNCTION public.update_onboarding_finished(
  clerk_id_param TEXT,
  finished_param BOOLEAN,
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

  -- Update user_preferences table
  INSERT INTO public.user_preferences (user_id, is_onboarding_finished, updated_at)
  VALUES (v_user_id, finished_param, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    is_onboarding_finished = EXCLUDED.is_onboarding_finished,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 6b. update_user_university
DROP FUNCTION IF EXISTS public.update_user_university;

CREATE OR REPLACE FUNCTION public.update_user_university(
  clerk_id_param TEXT,
  university_param TEXT,
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

  -- Update users table
  UPDATE public.users 
  SET selected_university = university_param
  WHERE id = v_user_id;

  -- Update user_preferences table
  INSERT INTO public.user_preferences (user_id, selected_university, updated_at)
  VALUES (v_user_id, university_param, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    selected_university = EXCLUDED.selected_university,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 7. get_internal_user_id (Helper for other services)
DROP FUNCTION IF EXISTS public.get_internal_user_id(TEXT);

CREATE OR REPLACE FUNCTION public.get_internal_user_id(clerk_id_param TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Try to match by clerk_id, local_clerk_id, or firebase_id
  SELECT id INTO v_user_id FROM public.users 
  WHERE clerk_id = clerk_id_param OR local_clerk_id = clerk_id_param OR firebase_id = clerk_id_param;
  
  -- 2. If not found, check if the input itself is a valid UUID and exists in users
  IF v_user_id IS NULL AND clerk_id_param ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id INTO v_user_id FROM public.users WHERE id = clerk_id_param::UUID;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 9. delete_user_by_clerk_id
DROP FUNCTION IF EXISTS public.delete_user_by_clerk_id(TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.delete_user_by_clerk_id(
  clerk_id_param TEXT,
  is_local_param BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users
  WHERE (is_local_param AND local_clerk_id = clerk_id_param)
     OR (NOT is_local_param AND clerk_id = clerk_id_param)
     OR (firebase_id = clerk_id_param)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  DELETE FROM public.users WHERE id = v_user_id;
  RETURN TRUE;
END;
$$;

-- 10. get_notification_opt_ins
DROP FUNCTION IF EXISTS public.get_notification_opt_ins(TEXT);
CREATE OR REPLACE FUNCTION public.get_notification_opt_ins(clerk_id_param TEXT)
RETURNS TABLE(user_id UUID, apps JSONB, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT uo.user_id, uo.apps, uo.updated_at
    FROM public.user_notification_opt_ins uo
    WHERE uo.user_id = v_user_id;
END;
$$;

-- 11. merge_notification_app_opt_in
DROP FUNCTION IF EXISTS public.merge_notification_app_opt_in(TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.merge_notification_app_opt_in(
    clerk_id_param TEXT,
    app_key_param TEXT,
    patch_param JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_merged JSONB;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO public.user_notification_opt_ins (user_id, apps, updated_at)
    VALUES (
        v_user_id,
        jsonb_build_object(app_key_param, patch_param),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        apps = jsonb_set(
            public.user_notification_opt_ins.apps,
            ARRAY[app_key_param],
            COALESCE(public.user_notification_opt_ins.apps -> app_key_param, '{}'::jsonb) || patch_param,
            true
        ),
        updated_at = NOW()
    RETURNING apps -> app_key_param INTO v_merged;

    RETURN v_merged;
END;
$$;

-- 12. list_notification_opt_in_users
DROP FUNCTION IF EXISTS public.list_notification_opt_in_users(TEXT);
CREATE OR REPLACE FUNCTION public.list_notification_opt_in_users(app_key_param TEXT)
RETURNS TABLE(user_id UUID, clerk_id TEXT, app_data JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT uo.user_id, u.clerk_id, uo.apps -> app_key_param AS app_data
    FROM public.user_notification_opt_ins uo
    INNER JOIN public.users u ON u.id = uo.user_id
    WHERE COALESCE((uo.apps -> app_key_param ->> 'enabled')::boolean, false) = true;
END;
$$;

-- Grants (yeni fonksiyonlar eklendikten sonra)
GRANT EXECUTE ON FUNCTION public.get_notification_opt_ins(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.merge_notification_app_opt_in(TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_notification_opt_in_users(TEXT) TO anon, authenticated, service_role;
