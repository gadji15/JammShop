-- Deals schema and views
-- This script adds optional promo columns, creates/updates the products_on_sale view
-- to be robust against compare_price vs compare_at_price column names, and defines
-- a materialized view product_deals_agg for fast sorting by effective discount.

begin;

-- 1) Optional promo columns (safe if already exist)
alter table public.products
  add column if not exists discount_percent numeric check (discount_percent >= 0 and discount_percent <= 100),
  add column if not exists promo_start timestamptz,
  add column if not exists promo_end timestamptz;

-- Useful indexes
create index if not exists idx_products_price on public.products (price);
create index if not exists idx_products_compare_price on public.products (compare_price);
create index if not exists idx_products_compare_at_price on public.products (compare_at_price);
create index if not exists idx_products_discount_percent on public.products (discount_percent);
create index if not exists idx_products_promo_window on public.products (promo_start, promo_end);

-- 2) Create/replace a robust "on sale" view using COALESCE(compare_price, compare_at_price)
--    Also ensure product is active and in promo window if dates are set.
create or replace view public.products_on_sale
as
select
  p.*
from public.products as p
where
  p.is_active = true
  and p.price is not null
  and coalesce(p.compare_price, p.compare_at_price) is not null
  and.price is not null
  and t.cmp is not null
  and t.cmp > p.price
  and (p.promo_start is null or p.promo_start <= now())
  and (p.promo_end is null or p.promo_end >= now());

grant select on public.products_on_sale to anon, authenticated;

-- 3) Materialized view for effective discount (fast sorting by highest discount)
--    Includes both explicit discount_percent and computed compare vs price.
drop materialized view if exists public.product_deals_agg;

create materialized view public.product_deals_agg
as
select
  p.id as product_id,
  greatest(
    coalesce(p.discount_percent, 0),
    case
      when coalesce(p.compare_price, p.compare_at_price) is not null
           and coalesce(p.compare_price, p.compare_at_price) > 0
           and p.price is not null
           and p.price < coalesce(p.compare_price, p.compare_at_price)
      then ((coalesce(p.compare_price, p.compare_at_price) - p.price) / coalesce(p.compare_price, p.compare_at_price)) * 100
      else 0
    end
  )::numeric(10,2) as effective_discount_pct
from public.products p
where p.is_active = true
  and (
    (coalesce(p.compare_price, p.compare_at_price) is not null and coalesce(p.compare_price, p.compare_at_price) > p.price)
    or coalesce(p.discount_percent, 0) > 0
  )
  and (p.promo_start is null or p.promo_start <= now())
  and (p.promo_end is null or p.promo_end >= now());

create index if not exists idx_product_deals_agg_discount on public.product_deals_agg (effective_discount_pct desc);
grant select on public.product_deals_agg to anon, authenticated;

-- 4) Refresh function (security definer)
create or replace function public.refresh_product_deals_agg() returns void
language sql
security definer
as $$
  refresh materialized view concurrently public.product_deals_agg;
$$;

grant execute on function public.refresh_product_deals_agg() to anon, authenticated;

commit;