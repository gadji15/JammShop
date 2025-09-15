-- Indexes and RLS policies for brand exposure via product_attributes

begin;

-- 1) Helpful indexes for brand lookups
create index if not exists idx_product_attributes_name_value on public.product_attributes (attribute_name, attribute_value);
create index if not exists idx_product_attributes_name_product on public.product_attributes (attribute_name, product_id);
create index if not exists idx_product_attributes_brand_value_lower on public.product_attributes ((lower(attribute_value))) where attribute_name = 'brand';

-- 2) Ensure RLS is enabled on product_attributes (if your project uses RLS)
alter table public.product_attributes enable row level security;

-- 3) Policy for public read of brand attributes only
drop policy if exists "Public read brand attributes" on public.product_attributes;
create policy "Public read brand attributes"
on public.product_attributes
for select
to anon, authenticated
using (attribute_name = 'brand');

commit;