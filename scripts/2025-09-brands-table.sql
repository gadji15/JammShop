-- Brands master table based on products.supplier_id
-- We use the same UUID as products.supplier_id for the brand id to enable simple joins.

begin;

create table if not exists public.brands (
  id uuid primary key,               -- equals products.supplier_id
  name text not null,
  slug text unique not null,
  logo_url text,
  website text,
  description text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_brands_name on public.brands using gin (to_tsvector('simple', coalesce(name, '')));
create index if not exists idx_brands_slug on public.brands (slug);

-- Seed from existing products supplier_id (only rows that do not exist)
insert into public.brands (id, name, slug)
select
  p.supplier_id,
  'Marque ' || left(p.supplier_id::text, 8),
  'brand-' || left(p.supplier_id::text, 8)
from public.products p
where p.supplier_id is not null
  and not exists (select 1 from public.brands b where b.id = p.supplier_id)
group by p.supplier_id;

-- Refresh/replace brands_agg to keep it separate from presentation data
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

grant select on public.brands to anon, authenticated;
grant select on public.brands_agg to anon, authenticated;

-- Create a joined view for API consumption (includes name/slug/logo from brands)
create or replace view public.brands_full
as
select
  a.supplier_id as id,
  coalesce(b.name, 'Marque ' || left(a.supplier_id::text, 8)) as name,
  b.slug,
  b.logo_url,
  a.product_count,
  a.first_created_at,
  a.last_created_at
from public.brands_agg a
left join public.brands b on b.id = a.supplier_id;

grant select on public.brands_full to anon, authenticated;

commit;