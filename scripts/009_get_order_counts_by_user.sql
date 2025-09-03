-- RPC to get order counts grouped by user_id
create or replace function public.get_order_counts_by_user()
returns table (user_id uuid, count bigint)
language sql
stable
as $$
  select user_id, count(id)::bigint as count
  from public.orders
  where user_id is not null
  group by user_id
$$;

grant execute on function public.get_order_counts_by_user() to anon, authenticated;