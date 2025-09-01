-- Create settings table (key/value)
create table if not exists public.settings (
  key text primary key,
  value text not null,
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();

-- Enable RLS
alter table public.settings enable row level security;

-- Helper: get role for current user
-- Assumes a profiles table with columns: id (uuid), role (text)
-- role in ('customer','admin','super_admin')
create or replace view public.v_current_profile as
select p.id, p.role
from public.profiles p
where p.id = auth.uid();

-- Policies:
-- 1) Allow SELECT for admins and super_admins
drop policy if exists "settings_select_admins" on public.settings;
create policy "settings_select_admins"
on public.settings
for select
to authenticated
using (
  exists (
    select 1 from public.v_current_profile v
    where v.id = auth.uid()
      and v.role in ('admin','super_admin')
  )
);

-- 2) Allow INSERT/UPDATE for super_admin only
drop policy if exists "settings_write_super_admin" on public.settings;
create policy "settings_write_super_admin"
on public.settings
for all
to authenticated
using (
  exists (
    select 1 from public.v_current_profile v
    where v.id = auth.uid()
      and v.role = 'super_admin'
  )
)
with check (
  exists (
    select 1 from public.v_current_profile v
    where v.id = auth.uid()
      and v.role = 'super_admin'
  )
);