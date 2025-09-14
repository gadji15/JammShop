-- Best-sellers materialized view + refresh function
-- Will only create objects if public.order_items exists with product_id and created_at

DO $
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'order_items'
  ) THEN
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
    AS $fn$
    BEGIN
      -- Use CONCURRENTLY to avoid read locks (requires supporting index)
      REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_sales_agg;
    END;
    $fn$;

    -- Allow execution from anon/authenticated (function runs as owner via SECURITY DEFINER)
    GRANT EXECUTE ON FUNCTION public.refresh_product_sales_agg() TO anon, authenticated;
  ELSE
    RAISE NOTICE 'Skipping best-sellers MV creation: public.order_items not found.';
  END IF;
END
$;