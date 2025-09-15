-- Supabase enhancements for search, featured listings and public reads
-- Run this script in your Supabase SQL editor or via migration tooling.

-- 1) Enable pg_trgm for fast ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2) Products: indexes for listings and search
CREATE INDEX IF NOT EXISTS products_active_created_idx ON public.products (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS products_active_featured_idx ON public.products (is_active, is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category_id);
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug);

-- Trigram index for name and short_description (ILIKE)
CREATE INDEX IF NOT EXISTS products_search_trgm
  ON public.products
  USING GIN (name gin_trgm_ops, short_description gin_trgm_ops);

-- 3) Categories: indexes for search and lookups
CREATE INDEX IF NOT EXISTS categories_active_name_idx ON public.categories (is_active, name);
CREATE INDEX IF NOT EXISTS categories_slug_idx ON public.categories (slug);

-- 4) Public RLS policies (safe read-only exposure of active rows)
-- Ensure RLS is enabled on these tables in your schema setup.

-- Products: public can SELECT only active rows
DROP POLICY IF EXISTS products_public_read ON public.products;
CREATE POLICY products_public_read
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Categories: public can SELECT only active rows
DROP POLICY IF EXISTS categories_public_read ON public.categories;
CREATE POLICY categories_public_read
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 5) OPTIONAL: Best-sellers aggregation (requires order_items table)
-- Uncomment if you have order_items(product_id, created_at) and want real rankings.
-- This creates a materialized view and index for fast ORDER BY.
--
-- CREATE MATERIALIZED VIEW IF NOT EXISTS public.product_sales_agg AS
--   SELECT
--     oi.product_id,
--     COUNT(*)::bigint AS sales_count,
--     MAX(oi.created_at) AS last_sale_at
--   FROM public.order_items oi
--   GROUP BY oi.product_id;
--
-- CREATE INDEX IF NOT EXISTS product_sales_agg_sales_idx
--   ON public.product_sales_agg (sales_count DESC);
--
-- -- Grant read access (optional, if you plan to query this from anon via server)
-- GRANT SELECT ON public.product_sales_agg TO anon, authenticated;
--
-- -- Refresh strategy: run periodically (cron) or via an Edge Function
-- -- REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_sales_agg;

-- 6) OPTIONAL: Local analytics table for hero/cta tracking (if you want to store events)
-- Uncomment to enable, otherwise Vercel Analytics can remain the only sink.
--
-- CREATE TABLE IF NOT EXISTS public.analytics_events (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id uuid NULL,
--   name text NOT NULL,
--   props jsonb,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );
--
-- -- RLS: allow inserts from both anon and authenticated (adjust to your needs)
-- ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS analytics_events_insert ON public.analytics_events;
-- CREATE POLICY analytics_events_insert
--   ON public.analytics_events
--   FOR INSERT
--   TO anon, authenticated
--   WITH CHECK (true);
--
-- CREATE INDEX IF NOT EXISTS analytics_events_name_created_idx
--   ON public.analytics_events (name, created_at DESC);

-- Notes:
-- - If your schema uses a different namespace than 'public', adjust table references accordingly.
-- - Review and adapt optional sections based on your data model and privacy policy.