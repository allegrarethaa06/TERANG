# TERANG – Supabase Backend

File migration: `migrations/20261111_001_terang_backend.sql` (belum dijalankan, frontend belum diubah).

## Cara menjalankan (Supabase SQL Editor)
1. Buat project di https://supabase.com (disarankan coba di project **staging** dulu).
2. Dashboard → **SQL Editor** → **New query**.
3. Buka file SQL, salin seluruh isinya, tempel, klik **Run**. Migration dibungkus `begin/commit`, jadi jika ada error semuanya dibatalkan otomatis.
4. Verifikasi:
   - **Table Editor**: `profiles`, `reports`, `report_photos` ada, RLS aktif.
   - **Storage**: bucket `report-photos` (Private).
   - **Authentication → Policies**: policy terlihat di tiap tabel.
5. Jadikan akun admin (opsional), jalankan manual:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'admin@contoh.id');
   ```
Aman dijalankan ulang (idempotent) dan tidak ada perintah `drop table`/`delete` data.

## Yang terbentuk
| Objek | Fungsi |
|---|---|
| `profiles` | 1 baris per `auth.users`: `full_name`, `role` (`warga`/`admin`). Dibuat otomatis oleh trigger saat daftar. Email tetap di Supabase Auth. |
| `reports` | Laporan: `public_id` (TRG-100001, unik via sequence), `owner_id`, kategori, judul, alamat, lat/lng, deskripsi, `safety_impact`, `reporter_visibility`, `status`, `priority`, `priority_reason`, tanggal. |
| `report_photos` | Maks. 3 foto/laporan (`position` 0–2), `storage_path` = `{owner_id}/{report_id}/{file}`. |
| `public_reports` (view) | Data publik laporan terverifikasi. Tanpa `owner_id`; `reporter_name` = nama hanya jika pelapor memilih "nama", selain itu `Pelapor Anonim`. |
| `public_report_photos` (view) | Daftar path foto laporan publik. |
| bucket `report-photos` | Private, maks 5 MB, JPG/PNG/WebP. |

## Keamanan (ringkas)
- **Warga**: baca/buat laporan & foto miliknya; edit/hapus hanya selama status `Menunggu Verifikasi`.
- **Status/prioritas/owner/ID**: dipaksa oleh trigger (`reports_guard`). Insert baru selalu `Menunggu Verifikasi`, prioritas kosong; update oleh warga ke kolom itu ditolak.
- **Role** tidak bisa diubah sendiri (`profiles_guard`).
- **Anon (belum login)** hanya bisa `select` dari 2 view publik; tidak bisa menyentuh tabel asli.
- **Foto**: bucket private. Pemilik & admin bisa baca; publik hanya bisa baca foto laporan yang sudah diverifikasi. Upload wajib di folder `auth.uid()`.
- Laporan yang masih `Menunggu Verifikasi` tidak tampil di publik.

## Catatan untuk tahap frontend berikutnya
- Frontend perlu `@supabase/supabase-js` dan env `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (anon key aman di klien; **jangan** pakai `service_role` di frontend).
- Alur kirim: insert `reports` → upload foto ke `report-photos/{uid}/{report.id}/...` → insert `report_photos`. Tampilkan foto dengan `createSignedUrl`.
- `reporter_public_name` sengaja tidak disimpan; nama publik dihitung di view agar tak bisa dipalsukan.
- Koordinat & alamat tampil di view publik (dibutuhkan peta). Jika ingin dikaburkan, bisa dibulatkan di view.
- Menghapus user di Auth ikut menghapus profil, laporan, dan foto (cascade). Berkas di Storage perlu dibersihkan terpisah.
- Data demo di `localStorage` tidak otomatis pindah ke Supabase.
