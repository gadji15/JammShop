-- Aggregate brands/suppliers from products table
-- Creates a view brands_agg that groups by supplier_id with product counts and timestamps

begin;

create or replace view public.brands_agg
as
select
  p.supplier_id,
  count(*)::bigint as product_count,
  min(p.created_at) as first_created_at,
  max(p.created_at) as last_created_at
from public.products p
where p.supplier_id is not null
group by p.supplier_id;

grant select on public.brands_agg to anon, authenticated;

commit;