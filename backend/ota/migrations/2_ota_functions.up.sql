-- 1. get_latest_bundle
CREATE OR REPLACE FUNCTION public.get_latest_bundle(
    p_platform TEXT,
    p_current_build_number INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_latest_bundle RECORD;
BEGIN
    SELECT * INTO v_latest_bundle
    FROM public.app_bundles
    WHERE (platform = p_platform OR platform = 'all')
      AND is_active = TRUE
      AND build_number > p_current_build_number
    ORDER BY build_number DESC, created_at DESC
    LIMIT 1;

    IF v_latest_bundle IS NULL THEN
        RETURN jsonb_build_object('available', FALSE);
    ELSE
        RETURN jsonb_build_object(
            'available', TRUE,
            'bundle', jsonb_build_object(
                'id', v_latest_bundle.id,
                'version', v_latest_bundle.version,
                'build_number', v_latest_bundle.build_number,
                'bundle_url', v_latest_bundle.bundle_url,
                'checksum', v_latest_bundle.checksum,
                'is_active', v_latest_bundle.is_active,
                'is_beta', v_latest_bundle.is_beta,
                'platform', v_latest_bundle.platform,
                'notes', v_latest_bundle.notes,
                'created_at', v_latest_bundle.created_at
            )
        );
    END IF;
END;
$$;

-- 2. add_bundle
CREATE OR REPLACE FUNCTION public.add_bundle(
    p_version TEXT,
    p_build_number INTEGER,
    p_bundle_url TEXT,
    p_checksum TEXT,
    p_platform TEXT,
    p_notes TEXT,
    p_is_beta BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_bundle public.app_bundles;
BEGIN
    INSERT INTO public.app_bundles (
        version, build_number, bundle_url, checksum, platform, notes, is_beta
    )
    VALUES (
        p_version, p_build_number, p_bundle_url, p_checksum, p_platform, p_notes, p_is_beta
    )
    RETURNING * INTO v_new_bundle;

    RETURN jsonb_build_object(
        'id', v_new_bundle.id,
        'version', v_new_bundle.version,
        'build_number', v_new_bundle.build_number,
        'bundle_url', v_new_bundle.bundle_url,
        'checksum', v_new_bundle.checksum,
        'is_active', v_new_bundle.is_active,
        'is_beta', v_new_bundle.is_beta,
        'platform', v_new_bundle.platform,
        'notes', v_new_bundle.notes,
        'created_at', v_new_bundle.created_at
    );
END;
$$;

-- 3. get_all_bundles
CREATE OR REPLACE FUNCTION public.get_all_bundles()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bundles JSONB;
BEGIN
    SELECT jsonb_agg(t) INTO v_bundles
    FROM (
        SELECT * FROM public.app_bundles
        ORDER BY build_number DESC, created_at DESC
    ) t;

    RETURN jsonb_build_object('bundles', COALESCE(v_bundles, '[]'::jsonb));
END;
$$;
