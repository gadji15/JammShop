-- Presets for admin analytics views (saved filters)
CREATE TABLE IF NOT EXISTS public.analytics_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  params jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_views ENABLE ROW LEVEL SECURITY;

-- Only owners can access their views
DROP POLICY IF EXISTS analytics_views_owner_all ON public.analytics_views;
CREATE POLICY analytics_views_owner_all
  ON public.analytics_views
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS analytics_views_user_idx ON public.analytics_views (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS analytics_views_user_name_unique ON public.analytics_views (user_id, name);