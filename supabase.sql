-- Jalankan seluruh SQL ini di Supabase > SQL Editor.
-- Admin hanya ditentukan melalui app_metadata.role = 'admin' (bukan metadata yang bisa diubah user).

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  location text,
  found_date date not null default current_date,
  image_url text,
  status text not null default 'available'
    check (status in ('available', 'returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.items enable row level security;

-- Semua pengunjung boleh melihat daftar barang.
drop policy if exists "Public can view items" on public.items;
create policy "Public can view items"
on public.items for select
to anon, authenticated
using (true);

-- Hanya akun admin yang memiliki app_metadata.role = admin boleh mengelola data.
drop policy if exists "Admins can insert items" on public.items;
create policy "Admins can insert items"
on public.items for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update items" on public.items;
create policy "Admins can update items"
on public.items for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete items" on public.items;
create policy "Admins can delete items"
on public.items for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Bucket foto barang. Buat bucket bernama found-items dan set Public = ON
-- melalui Storage > Buckets. Policy di bawah membatasi upload/update/delete ke admin.
insert into storage.buckets (id, name, public)
values ('found-items', 'found-items', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view found item photos" on storage.objects;
create policy "Public can view found item photos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'found-items');

drop policy if exists "Admins can upload found item photos" on storage.objects;
create policy "Admins can upload found item photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'found-items'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admins can update found item photos" on storage.objects;
create policy "Admins can update found item photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'found-items'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  bucket_id = 'found-items'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admins can delete found item photos" on storage.objects;
create policy "Admins can delete found item photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'found-items'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
