-- Best-sellers materialized view + refresh function
-- Requirements: public.order_items with product_id uuid and created_at timestamptz

-- 1) Materialized view aggregating sales per product
CREATE MATERIALIZED VIEW IF NOT EXISTS public.product_sales_agg AS
  SELECT
    oi.product_id,
    COUNT(*)::bigint AS sales_count,
    MAX(oi.created_at) AS last_sale_at
  FROM public.order_items oi
  GROUP BY oi.product_id;

-- Index for fast ordering by sales
CREATE INDEX IF NOT EXISTS product_sales_agg_sales_idx
  ON public.product_sales_agg (sales_count DESC);

-- 2) Grant read access (optional for server-side querying as anon)
GRANT SELECT ON public.product_sales_agg TO anon, authenticated;

-- 3) Refresh function callable from server (Next API route / cron)
CREATE OR REPLACE FUNCTION public.refresh_product_sales_agg()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use CONCURRENTLY to avoid read locks (requires supporting index)
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_sales_agg;
END;
$$;

-- Allow execution from anon/authenticated (function runs as owner via SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.refresh_product_sales_agg() TO anon, authenticated;

-- Notes:
-- - Schedule periodic refresh using:
--   a) Vercel Cron hitting your Next route that calls this function, or
--   b) Supabase's pg_cron (if enabled) with a job that calls SELECT refresh_product_sales_agg();
-- - Client \"best sellers\" can be implemented server-side by ordering products
--   using a join on this MV:
--     SELECT p.*
--     FROM public.products p
--     LEFT JOIN public.product_sales_agg psa ON psa.product_id = p.id
--     WHERE p.is_active = true
--     ORDER BY psa.sales_count DESC NULLS LAST, p.created_at DESC
--     LIMIT 8;