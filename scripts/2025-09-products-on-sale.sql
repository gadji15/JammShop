-- Products on sale view
-- Creates a simple view exposing only active products where compare_price > price.
-- Keeps category_id and other columns so PostgREST relations (e.g., categories (*)) continue to work.

begin;

create or replace view public.products_on_sale
as
select
  p.*
from public.products as p
where
  p.is_active = true
  and p.compare_price is not null
  and p.price is not null
  and p.compare_price > p.price;

-- Optional: performance helpers (indexes on base table are used; views don't have their own indexes)

-- Grants (RLS on base table still applies; grant select on view to roles)
grant select on public.products_on_sale to anon, authenticated;

commit;