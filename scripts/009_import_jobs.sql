-- Import jobs tables for external supplier imports

-- Jobs table
create table if not exists public.import_jobs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  user_id uuid,
  supplier text,
  source_url text,
  status text not null default 'running', -- running | success | failed | partial
  success_count integer not null default 0,
  failed_count integer not null default 0,
  error text,
  pricing_rules jsonb
);

-- Items per job
create table if not exists public.import_job_items (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  job_id bigint not null,
  external_id text,
  product_id uuid,
  name text,
  status text not null default 'pending', -- pending | success | failed
  error text,
  raw jsonb,
  constraint fk_import_job_items_job_id foreign key (job_id) references public.import_jobs (id) on delete cascade
);

-- Helpful index
create index if not exists idx_import_job_items_job_id on public.import_job_items (job_id);

-- RLS (optional - restrict to admins via your app logic; by default, enable to false)
alter table public.import_jobs enable row level security;
alter table public.import_job_items enable row level security;

-- Simple permissive policies (you may tighten later)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'import_jobs' and policyname = 'allow_all_admin_read_write') then
    create policy allow_all_admin_read_write on public.import_jobs for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'import_job_items' and policyname = 'allow_all_admin_items') then
    create policy allow_all_admin_items on public.import_job_items for all using (true) with check (true);
  end if;
end$$;