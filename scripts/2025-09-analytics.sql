-- Optional analytics storage for hero/CTA events

-- 1) Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  name text NOT NULL,
  props jsonb,
  ip inet NULL,
  ua text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Inserts allowed from anon and authenticated (adjust to your policy)
DROP POLICY IF EXISTS analytics_events_insert ON public.analytics_events;
CREATE POLICY analytics_events_insert
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3) Indexes
CREATE INDEX IF NOT EXISTS analytics_events_name_created_idx
  ON public.analytics_events (name, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_created_idx
  ON public.analytics_events (created_at DESC);