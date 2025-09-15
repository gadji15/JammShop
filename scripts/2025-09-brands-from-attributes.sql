-- Brands derived from product_attributes (attribute_name = 'brand')
-- Provides a normalized slug and product counts per brand name.

begin;

create or replace view public.brands_attr
as
with raw as (
  select
    lower(trim(pa.attribute_value)) as brand_name_raw,
    -- Normalize to slug: keep a-z0-9, replace others by '-', squeeze repeats, trim
    trim(both '-' from regexp_replace(lower(pa.attribute_value), '[^a-z0-9]+', '-', 'g')) as slug,
    p.id as product_id,
    p.created_at
  from public.product_attributes pa
  join public.products p on p.id = pa.product_id
  where pa.attribute_name = 'brand'
    and pa.attribute_value is not null
)
select
  brand_name_raw as name,
  slug,
  count(distinct product_id)::bigint as product_count,
  min(created_at) as first_created_at,
  max(created_at) as last_created_at
from raw
group by brand_name_raw, slug;

grant select on public.brands_attr to anon, authenticated;

commit;