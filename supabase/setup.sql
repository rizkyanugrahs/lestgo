-- =====================================================================
-- LiveOps - SETUP LENGKAP DATABASE (versi 1.6.0)
-- Aman dijalankan berulang kali. Selalu pakai versi terbaru file ini.
-- =====================================================================

-- 1. Profil pengguna -------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  full_name text,
  employee_id text,
  join_date date,
  avatar_url text,
  language text not null default 'en',
  created_at timestamptz not null default now()
);

-- 2. Tugas -----------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  priority text not null default 'normal',
  is_done boolean not null default false,
  deadline timestamptz,
  image_url text,
  created_at timestamptz not null default now()
);

-- 3. Jadwal shift ----------------------------------------------------
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  shift_date date not null,
  shift_type text not null default 'off',
  note text,
  created_at timestamptz not null default now()
);

-- 4. Produk ----------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  category text,
  key_ingredients text,
  benefits text,
  how_to_use text,
  age_range text,
  contraindications text,
  image_url text,
  created_at timestamptz not null default now()
);

-- 5. GMV harian dan target bulanan -----------------------------------
create table if not exists public.gmv_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gmv_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month text not null,
  target numeric not null default 0,
  created_at timestamptz not null default now()
);

-- 6. Galeri foto -----------------------------------------------------
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  image_url text not null,
  caption text,
  taken_at date,
  created_at timestamptz not null default now()
);

-- 6b. Cuti: saldo = total top-up dikurangi total pemakaian ------------
create table if not exists public.leave_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'usage',
  entry_date date not null,
  end_date date,
  days numeric not null default 1,
  note text,
  created_at timestamptz not null default now()
);

-- 6c. Daftar partner live (nama yang bisa dipilih sebagai partner / tim)
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 7. Kolom tambahan (aman jika sudah ada) ----------------------------
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists employee_id text;
alter table public.profiles add column if not exists join_date date;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists language text not null default 'en';
alter table public.tasks add column if not exists image_path text;
alter table public.products add column if not exists image_path text;
alter table public.gallery_photos add column if not exists image_path text;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists contract_end date;
alter table public.profiles add column if not exists payday smallint;
alter table public.profiles add column if not exists partners_seeded boolean not null default false;
alter table public.shifts add column if not exists session1_start text;
alter table public.shifts add column if not exists session1_end text;
alter table public.shifts add column if not exists session1_platform text;
alter table public.shifts add column if not exists session2_start text;
alter table public.shifts add column if not exists session2_end text;
alter table public.shifts add column if not exists session2_platform text;
alter table public.shifts add column if not exists partner text;
alter table public.shifts add column if not exists team text[] not null default '{}'::text[];
alter table public.leave_entries add column if not exists leave_type text;
alter table public.shifts add column if not exists leave_entry_id uuid references public.leave_entries(id) on delete cascade;
alter table public.gmv_entries add column if not exists tiktok_amount numeric;
alter table public.gmv_entries add column if not exists shopee_amount numeric;
alter table public.gmv_entries add column if not exists partner text;
alter table public.tasks add column if not exists deadline_date date;
alter table public.tasks add column if not exists deadline_time text;
alter table public.gallery_photos alter column image_url drop not null;

-- 8. Aturan unik -----------------------------------------------------
create unique index if not exists shifts_user_date_uidx on public.shifts (user_id, shift_date);
create unique index if not exists gmv_entries_user_date_uidx on public.gmv_entries (user_id, entry_date);
create unique index if not exists gmv_targets_user_month_uidx on public.gmv_targets (user_id, month);
create unique index if not exists partners_user_name_uidx on public.partners (user_id, name);

-- 9. Indeks untuk kecepatan ------------------------------------------
create index if not exists tasks_user_done_idx on public.tasks (user_id, is_done);
create index if not exists products_user_name_idx on public.products (user_id, name);
create index if not exists products_user_category_idx on public.products (user_id, category);
create index if not exists leave_entries_user_date_idx on public.leave_entries (user_id, entry_date);
create index if not exists shifts_leave_entry_idx on public.shifts (leave_entry_id);

-- 10. Keamanan: data hanya bisa dilihat pemiliknya (Row Level Security)
do $$
declare
  t text;
begin
  foreach t in array array['profiles','tasks','shifts','products','gmv_entries','gmv_targets','gallery_photos','leave_entries','partners']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', 'own_' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      'own_' || t, t
    );
  end loop;
end
$$;

-- 11. Penyimpanan foto (privat, tiap pengguna hanya akses foldernya sendiri)
insert into storage.buckets (id, name, public)
values ('liveops-files', 'liveops-files', false)
on conflict (id) do nothing;

drop policy if exists "liveops_files_select" on storage.objects;
create policy "liveops_files_select" on storage.objects for select to authenticated
  using (bucket_id = 'liveops-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "liveops_files_insert" on storage.objects;
create policy "liveops_files_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'liveops-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "liveops_files_update" on storage.objects;
create policy "liveops_files_update" on storage.objects for update to authenticated
  using (bucket_id = 'liveops-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "liveops_files_delete" on storage.objects;
create policy "liveops_files_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'liveops-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- 12. Izin akses -----------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- 13. Muat ulang skema agar langsung dikenali ------------------------
notify pgrst, 'reload schema';
