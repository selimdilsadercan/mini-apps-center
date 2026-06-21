CREATE TABLE IF NOT EXISTS public.app_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    build_number INTEGER NOT NULL,
    bundle_url TEXT NOT NULL,
    checksum TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_beta BOOLEAN NOT NULL DEFAULT FALSE,
    platform TEXT NOT NULL, -- 'ios', 'android', 'all'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_bundles_platform_active ON public.app_bundles(platform, is_active);
CREATE INDEX IF NOT EXISTS idx_app_bundles_build_number ON public.app_bundles(build_number);

-- Grants
GRANT ALL ON TABLE public.app_bundles TO anon, authenticated, service_role;
