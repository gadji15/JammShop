-- Create storage bucket for product images (public)
insert into storage.buckets (id, name, public)
select 'product-images', 'product-images', true
where not exists (select 1 from storage.buckets where id = 'product-images');

-- Ensure RLS is enabled (usually enabled by default on storage.objects)
alter table storage.objects enable row level security;

-- Create policies only if they don't already exist
do $$
begin
  -- Public read
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public Access'
  ) then
    create policy "Public Access"
      on storage.objects
      for select
      to public
      using (bucket_id = 'product-images');
  end if;

  -- Authenticated insert (upload)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can upload'
  ) then
    create policy "Authenticated users can upload"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'product-images');
  end if;

  -- Authenticated update
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can update'
  ) then
    create policy "Authenticated users can update"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'product-images')
      with check (bucket_id = 'product-images');
  end if;

  -- Authenticated delete
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can delete'
  ) then
    create policy "Authenticated users can delete"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'product-images');
  end if;
end
$$;