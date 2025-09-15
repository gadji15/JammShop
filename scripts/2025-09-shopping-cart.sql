-- Shopping cart table with RLS, professional and reliable setup
-- Users can only see and modify their own cart rows.

begin;

-- Required for gen_random_uuid
create extension if not exists pgcrypto;

create table if not exists public.shopping_cart (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure uniqueness per (user_id, product_id)
create unique index if not exists shopping_cart_user_product_uidx on public.shopping_cart(user_id, product_id);

-- Helpful lookup indexes
create index if not exists shopping_cart_user_idx on public.shopping_cart(user_id);
create index if not exists shopping_cart_product_idx on public.shopping_cart(product_id);

-- Trigger to keep updated_at fresh
create or replace function public.set_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_timestamp_updated_at on public.shopping_cart;
create trigger trg_set_timestamp_updated_at
before update on public.shopping_cart
for each row
execute function public.set_timestamp_updated_at();

-- RLS policies
alter table public.shopping_cart enable row level security;

-- Read own rows
drop policy if exists "cart_select_own" on public.shopping_cart;
create policy "cart_select_own"
on public.shopping_cart
for select
to authenticated
using (auth.uid() = user_id);

-- Insert own rows
drop policy if exists "cart_insert_own" on public.shopping_cart;
create policy "cart_insert_own"
on public.shopping_cart
for insert
to authenticated
with check (auth.uid() = user_id);

-- Update own rows
drop policy if exists "cart_update_own" on public.shopping_cart;
create policy "cart_update_own"
on public.shopping_cart
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Delete own rows
drop policy if exists "cart_delete_own" on public.shopping_cart;
create policy "cart_delete_own"
on public.shopping_cart
for delete
to authenticated
using (auth.uid() = user_id);

commit;