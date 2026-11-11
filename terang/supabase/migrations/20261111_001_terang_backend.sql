-- =============================================================================
-- TERANG - Supabase backend migration 001
-- Tabel: profiles, reports, report_photos | Storage: report-photos
-- Aman dijalankan ulang (idempotent). TIDAK menghapus data apa pun.
-- Jalankan di: Supabase Dashboard > SQL Editor > New query > Run
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Helper umum
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. profiles  (1 baris per auth.users; identitas tetap di Supabase Auth)
--    Email TIDAK disalin: sumber kebenaran email adalah auth.users.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default 'Warga TERANG'
             check (char_length(btrim(full_name)) between 1 and 100),
  role       text not null default 'warga'
             check (role in ('warga', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Helper admin. SECURITY DEFINER agar bisa membaca profiles tanpa rekursi RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Buat profil otomatis saat pengguna mendaftar (Supabase Auth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Warga TERANG'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill untuk pengguna yang sudah ada (tidak menimpa apa pun)
insert into public.profiles (id, full_name)
select u.id,
       coalesce(
         nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
         nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
         'Warga TERANG'
       )
from auth.users u
on conflict (id) do nothing;

-- Pengguna biasa tidak boleh mengubah role / id sendiri.
-- (auth.uid() null = SQL Editor / service_role, diizinkan untuk bootstrap admin)
create or replace function public.profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Perubahan role tidak diizinkan' using errcode = '42501';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Perubahan id profil tidak diizinkan' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_trg on public.profiles;
create trigger profiles_guard_trg
  before update on public.profiles
  for each row execute function public.profiles_guard();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- Tidak ada policy INSERT/DELETE: profil dibuat oleh trigger, dihapus lewat cascade auth.users.

-- -----------------------------------------------------------------------------
-- 2. reports
-- -----------------------------------------------------------------------------
-- ID laporan unik, format sama dengan frontend: TRG-100001, TRG-100002, ...
create sequence if not exists public.report_public_id_seq start with 100001;

create table if not exists public.reports (
  id                 uuid primary key default gen_random_uuid(),
  public_id          text not null unique
                     default ('TRG-' || nextval('public.report_public_id_seq')::text),
  owner_id           uuid not null references auth.users (id) on delete cascade,

  -- Step 1: lokasi & jenis
  category           text not null
                     check (category in ('Jalan Rusak', 'Drainase', 'Lampu Jalan',
                                         'Penerangan Jalan', 'Fasilitas Umum', 'Lainnya')),
  custom_category    text check (custom_category is null or char_length(custom_category) <= 80),
  title              text not null check (char_length(btrim(title)) between 1 and 160),
  address            text not null check (char_length(btrim(address)) between 1 and 300),
  latitude           double precision not null check (latitude  between -90  and 90),
  longitude          double precision not null check (longitude between -180 and 180),
  subdistrict        text not null default 'Coblong',
  ward               text,

  -- Step 2: keterangan & risiko
  description        text not null check (char_length(btrim(description)) between 1 and 2000),
  safety_impact      text not null check (safety_impact in ('Ya', 'Tidak', 'Tidak Yakin')),

  -- Step 3: anonimitas (nama publik DIHITUNG di view, bukan disimpan dari klien)
  reporter_visibility text not null default 'anonim'
                     check (reporter_visibility in ('anonim', 'nama')),

  -- Dikelola admin (pengguna biasa tidak bisa mengubah; lihat trigger guard)
  status             text not null default 'Menunggu Verifikasi'
                     check (status in ('Menunggu Verifikasi', 'Terverifikasi',
                                       'Dalam Penanganan', 'Menunggu Konfirmasi',
                                       'Selesai', 'Ditutup')),
  priority           text check (priority is null or priority in ('Not Urgent', 'Urgent', 'Most Urgent')),
  priority_reason    text,
  verified_at        timestamptz,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists reports_owner_created_idx on public.reports (owner_id, created_at desc);
create index if not exists reports_status_idx        on public.reports (status);
create index if not exists reports_category_idx      on public.reports (category);

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- Guard: warga tidak bisa memalsukan owner/status/prioritas
create or replace function public.reports_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  -- SQL Editor / service_role (uid null) dan admin: tanpa batasan
  if uid is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.owner_id        := uid;
    new.status          := 'Menunggu Verifikasi';
    new.priority        := null;
    new.priority_reason := null;
    new.verified_at     := null;
    -- public_id selalu dari sequence, abaikan nilai kiriman klien
    new.public_id       := 'TRG-' || nextval('public.report_public_id_seq')::text;
    return new;
  end if;

  -- UPDATE oleh pemilik
  if new.owner_id        is distinct from old.owner_id
  or new.public_id       is distinct from old.public_id
  or new.status          is distinct from old.status
  or new.priority        is distinct from old.priority
  or new.priority_reason is distinct from old.priority_reason
  or new.verified_at     is distinct from old.verified_at
  or new.created_at      is distinct from old.created_at then
    raise exception 'Kolom ini hanya dapat diubah oleh admin' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists reports_guard_trg on public.reports;
create trigger reports_guard_trg
  before insert or update on public.reports
  for each row execute function public.reports_guard();

alter table public.reports enable row level security;

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin" on public.reports
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin());

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert to authenticated
  with check (owner_id = (select auth.uid()) or public.is_admin());

-- Pemilik hanya boleh mengedit selama belum diverifikasi
drop policy if exists "reports_update_own_pending" on public.reports;
create policy "reports_update_own_pending" on public.reports
  for update to authenticated
  using (
    (owner_id = (select auth.uid()) and status = 'Menunggu Verifikasi')
    or public.is_admin()
  )
  with check (owner_id = (select auth.uid()) or public.is_admin());

drop policy if exists "reports_delete_own_pending" on public.reports;
create policy "reports_delete_own_pending" on public.reports
  for delete to authenticated
  using (
    (owner_id = (select auth.uid()) and status = 'Menunggu Verifikasi')
    or public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 3. report_photos  (maks. 3 foto per laporan, file ada di Storage)
-- -----------------------------------------------------------------------------
create table if not exists public.report_photos (
  id           uuid primary key default gen_random_uuid(),
  report_id    uuid not null references public.reports (id) on delete cascade,
  owner_id     uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,           -- {owner_id}/{report_id}/{nama-file}
  position     smallint not null default 0 check (position between 0 and 2),
  file_name    text,
  mime_type    text check (mime_type is null or mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes   integer check (size_bytes is null or size_bytes between 1 and 5242880),
  created_at   timestamptz not null default now(),
  unique (report_id, position),
  -- path wajib berada di folder pemilik & laporan yang sama
  check (storage_path like owner_id::text || '/' || report_id::text || '/%')
);

create index if not exists report_photos_report_idx on public.report_photos (report_id, position);

alter table public.report_photos enable row level security;

drop policy if exists "report_photos_select_own_or_admin" on public.report_photos;
create policy "report_photos_select_own_or_admin" on public.report_photos
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin());

drop policy if exists "report_photos_insert_own_pending" on public.report_photos;
create policy "report_photos_insert_own_pending" on public.report_photos
  for insert to authenticated
  with check (
    public.is_admin()
    or (
      owner_id = (select auth.uid())
      and exists (
        select 1 from public.reports r
        where r.id = report_id
          and r.owner_id = (select auth.uid())
          and r.status = 'Menunggu Verifikasi'
      )
    )
  );

drop policy if exists "report_photos_delete_own_pending" on public.report_photos;
create policy "report_photos_delete_own_pending" on public.report_photos
  for delete to authenticated
  using (
    public.is_admin()
    or (
      owner_id = (select auth.uid())
      and exists (
        select 1 from public.reports r
        where r.id = report_id
          and r.owner_id = (select auth.uid())
          and r.status = 'Menunggu Verifikasi'
      )
    )
  );
-- Tidak ada policy UPDATE: ganti foto = hapus + unggah ulang.

-- -----------------------------------------------------------------------------
-- 4. View publik (tanpa owner_id, tanpa identitas pelapor anonim)
--    Hanya laporan yang SUDAH diverifikasi admin yang tampil ke publik.
--    View berjalan dengan hak pemilik view (melewati RLS) -> hanya kolom aman.
-- -----------------------------------------------------------------------------
create or replace view public.public_reports
with (security_invoker = false) as
select
  r.public_id                               as id,
  r.title,
  r.category,
  r.custom_category,
  r.address,
  r.latitude,
  r.longitude,
  r.subdistrict,
  r.ward,
  r.description,
  r.safety_impact,
  r.status,
  r.priority,
  r.priority_reason,
  r.created_at,
  case when r.reporter_visibility = 'nama'
       then p.full_name
       else 'Pelapor Anonim'
  end                                       as reporter_name
from public.reports r
left join public.profiles p on p.id = r.owner_id
where r.status <> 'Menunggu Verifikasi';

create or replace view public.public_report_photos
with (security_invoker = false) as
select
  r.public_id as report_id,
  ph.storage_path,
  ph.position
from public.report_photos ph
join public.reports r on r.id = ph.report_id
where r.status <> 'Menunggu Verifikasi';

revoke all on public.public_reports       from public, anon, authenticated;
revoke all on public.public_report_photos from public, anon, authenticated;
grant select on public.public_reports       to anon, authenticated;
grant select on public.public_report_photos to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Hak akses tabel (RLS tetap menjadi gerbang utama)
-- -----------------------------------------------------------------------------
revoke all on public.profiles, public.reports, public.report_photos from anon;
grant select, update                  on public.profiles      to authenticated;
grant select, insert, update, delete  on public.reports       to authenticated;
grant select, insert, delete          on public.report_photos to authenticated;
grant usage on sequence public.report_public_id_seq to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Storage bucket foto (PRIVATE; tampilkan lewat signed URL)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Apakah file ini milik laporan yang sudah publik? (definer: aman dipakai anon)
create or replace function public.is_public_report_photo(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.report_photos ph
    join public.reports r on r.id = ph.report_id
    where ph.storage_path = p_path
      and r.status <> 'Menunggu Verifikasi'
  );
$$;

-- Struktur path wajib: {auth.uid()}/{report_id}/{file}
drop policy if exists "report_photos_obj_select" on storage.objects;
create policy "report_photos_obj_select" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'report-photos'
    and (
      public.is_public_report_photo(name)
      or (select auth.uid())::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

drop policy if exists "report_photos_obj_insert" on storage.objects;
create policy "report_photos_obj_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'report-photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
    and array_length(storage.foldername(name), 1) = 2
  );

drop policy if exists "report_photos_obj_delete" on storage.objects;
create policy "report_photos_obj_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'report-photos'
    and ((select auth.uid())::text = (storage.foldername(name))[1] or public.is_admin())
  );
-- Tidak ada policy UPDATE objek: tidak ada timpa-file.

commit;

-- =============================================================================
-- SETELAH MIGRATION (jalankan manual bila perlu, JANGAN otomatis):
--
-- Jadikan akun tertentu admin (SQL Editor berjalan sebagai postgres, diizinkan):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'admin@contoh.id');
-- =============================================================================
