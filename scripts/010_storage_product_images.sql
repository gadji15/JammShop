-- Create storage bucket for product images (public)
insert into storage.buckets (id, name, public)
select 'product-images', 'product-images', true
where not exists (select 1 from storage.buckets where id = 'product-images');

-- Allow public read access to product-images
create policy if not exists "Public Access"
on storage.objects for select
to public
using (bucket_id = 'product-images');

-- Allow authenticated users to upload to product-images
create policy if not exists "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

-- Allow owners to update/delete their uploads (optional relaxed)
create policy if not exists "Authenticated users can update"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create policy if not exists "Authenticated users can delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images');