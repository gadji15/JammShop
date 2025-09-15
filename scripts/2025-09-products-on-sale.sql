-- Products on sale view (robust)
-- Exposes only active products where COALESCE(compare_price, compare_at_price) > price
-- and promo window (promo_start/promo_end) is valid if present.

begin;

create or replace view public.products_on_sale
as
select
  p.*
from public.products as p
where
  p.is_active = true
  and p.price is not null
  and coalesce(p.compare_price, p.compare_at_price) is not null
  and coalesce(p.compare_price, p.compare_at_price) > p.price
  and (p.promo_start is null or p.promo_start <= now())
  and (p.promo_end is null or p.promo_end >= now());

-- Grants (RLS on base table still applies; grant select on view to roles)
grant select on public.products_on_sale to anon, authenticated;

commit;