// Uji integrasi TERANG <-> Supabase (publishable key saja; tidak mencetak secret).
// Pakai: $env:TEST_EMAIL='akun-terverifikasi@...'; $env:TEST_PASSWORD='...'; node scripts/supabase-integration-test.mjs
// Akun HARUS sudah terverifikasi emailnya (verifikasi email aktif). Laporan uji dibersihkan di akhir.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envRaw = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const env = Object.fromEntries(
  envRaw.split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!URL_ || !KEY) { console.log('ENV KOSONG'); process.exit(1); }
console.log('Key type:', KEY.startsWith('sb_publishable_') ? 'publishable' : KEY.startsWith('sb_secret_') ? 'SECRET (BAHAYA)' : 'jwt/anon?');

const mk = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const results = [];
const check = (name, ok, extra = '') => { results.push([name, ok]); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`); };

const stamp = Date.now();
const email = process.env.TEST_EMAIL || `terang.integrasi.${stamp}@example.com`;
const password = process.env.TEST_PASSWORD || 'Uji!Terang2026#x';

// PNG 1x1 valid (merah) sebagai foto uji
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const A = mk();
// 1. Daftar
const su = process.env.TEST_EMAIL
  ? await A.auth.signInWithPassword({ email, password }) // akun terverifikasi yang sudah ada
  : await A.auth.signUp({ email, password, options: { data: { full_name: 'Uji Integrasi' } } });
console.log('signUp error:', su.error?.message || null, '| session:', Boolean(su.data?.session), '| user:', Boolean(su.data?.user));
if (su.error) { check('signUp', false, su.error.message); process.exit(2); }
check('signUp berhasil', true);
if (!su.data.session) {
  console.log('VERIFIKASI EMAIL AKTIF: signUp tidak mengembalikan sesi. Coba login langsung:');
  const si0 = await A.auth.signInWithPassword({ email, password });
  console.log('signIn sebelum verifikasi ->', si0.error?.message || 'OK');
  check('Email confirmation aktif (login ditolak sebelum verifikasi)', Boolean(si0.error));
  process.exit(3);
}
const uid = su.data.user.id;

// 2. Profil otomatis (trigger)
const prof = await A.from('profiles').select('id, full_name, role').eq('id', uid).maybeSingle();
check('profil pengguna terbaca dari tabel profiles', Boolean(prof.data?.id), JSON.stringify(prof.error || ''));

// 3. Warga tidak bisa menaikkan role
const esc = await A.from('profiles').update({ role: 'admin' }).eq('id', uid).select();
check('warga TIDAK bisa ubah role jadi admin', Boolean(esc.error) || (esc.data || []).length === 0 || esc.data[0].role !== 'admin', esc.error?.message || '');

// 4. Insert laporan (coba palsukan status/prioritas/owner)
const ins = await A.from('reports').insert({
  owner_id: uid, category: 'Jalan Rusak', title: 'Uji integrasi - lubang jalan', address: 'Jl. Dipatiukur, Coblong',
  latitude: -6.8924, longitude: 107.6178, subdistrict: 'Coblong', description: 'Laporan uji integrasi otomatis.',
  safety_impact: 'Ya', reporter_visibility: 'anonim', status: 'Selesai', priority: 'Most Urgent',
}).select('id, public_id, status, priority, owner_id').single();
check('insert laporan berhasil', !ins.error && ins.data?.public_id?.startsWith('TRG-'), ins.error?.message || ins.data?.public_id);
check('status dipaksa "Menunggu Verifikasi" & prioritas null', ins.data?.status === 'Menunggu Verifikasi' && ins.data?.priority === null);
const rid = ins.data?.id;

// 5. Upload foto ke Storage + metadata (format path: {report_id}/{nama_file_acak})
const path = `${rid}/0_${stamp}.png`;
const up = await A.storage.from('report-photos').upload(path, png, { contentType: 'image/png', upsert: false });
check('upload foto ke Storage (path {reportId}/{file})', !up.error, up.error?.message || '');
const meta = await A.from('report_photos').insert({ report_id: rid, owner_id: uid, storage_path: path, position: 0, file_name: 'uji.png', mime_type: 'image/png', size_bytes: png.length });
check('insert report_photos', !meta.error, meta.error?.message || '');

// 6. Upload foto dengan format path tidak valid harus ditolak
const bad = await A.storage.from('report-photos').upload(`invalid-root-file.png`, png, { contentType: 'image/png' });
check('upload file tanpa folder report_id DITOLAK', Boolean(bad.error), bad.error?.message || '');

// 7. Update status oleh warga ditolak
const upd = await A.from('reports').update({ status: 'Selesai' }).eq('id', rid).select();
check('warga TIDAK bisa ubah status', Boolean(upd.error) || (upd.data || []).length === 0 || upd.data[0].status !== 'Selesai', upd.error?.message || '');

// 8. Ambil laporan + signed URL, lalu unduh via signed URL
const list = await A.from('reports').select('*, report_photos(*)').eq('owner_id', uid);
check('Laporan Saya: laporan terbaca dengan foto', list.data?.length === 1 && list.data[0].report_photos?.length === 1);
const signed = await A.storage.from('report-photos').createSignedUrl(path, 60);
check('signed URL dibuat', Boolean(signed.data?.signedUrl), signed.error?.message || '');
if (signed.data?.signedUrl) {
  const r = await fetch(signed.data.signedUrl);
  const buf = Buffer.from(await r.arrayBuffer());
  check('foto terunduh via signed URL & identik dgn yang diunggah', r.ok && buf.equals(png), `status ${r.status}, ${buf.length}B`);
  const direct = await fetch(`${URL_}/storage/v1/object/public/report-photos/${path}`);
  check('akses URL publik langsung ke bucket private DITOLAK', !direct.ok, `status ${direct.status}`);
}

// 9. "Browser berbeda": klien baru, login dengan akun sama
const B = mk();
const si = await B.auth.signInWithPassword({ email, password });
check('login dari klien/browser kedua', !si.error, si.error?.message || '');
const list2 = await B.from('reports').select('public_id, title, report_photos(storage_path)').eq('owner_id', uid);
check('klien kedua melihat laporan & foto yang sama', list2.data?.length === 1 && list2.data[0].public_id === ins.data?.public_id && list2.data[0].report_photos.length === 1);

// 10. Anonim (tanpa login): tidak bisa membaca tabel asli, tidak bocor identitas
const C = mk();
const anonReports = await C.from('reports').select('id');
check('anon TIDAK bisa membaca tabel reports', (anonReports.data || []).length === 0, anonReports.error?.message || '');
const anonPub = await C.from('public_reports').select('*');
check('anon bisa baca view publik; laporan pending tidak tampil', !anonPub.error && !(anonPub.data || []).some((x) => x.id === ins.data?.public_id), anonPub.error?.message || '');
const anonProf = await C.from('profiles').select('id');
check('anon TIDAK bisa membaca profiles', (anonProf.data || []).length === 0);
const anonSigned = await C.storage.from('report-photos').createSignedUrl(path, 60);
check('anon TIDAK bisa membuat signed URL foto pending', Boolean(anonSigned.error) || !anonSigned.data?.signedUrl, anonSigned.error?.message || '');
const cols = anonPub.data?.[0] ? Object.keys(anonPub.data[0]) : null;
if (cols) check('view publik tidak memuat owner_id', !cols.includes('owner_id'));

// 10b. Pengujian isolasi multi-akun (jika TEST_EMAIL_2 disediakan)
if (process.env.TEST_EMAIL_2 && process.env.TEST_PASSWORD_2) {
  const D = mk();
  const si2 = await D.auth.signInWithPassword({
    email: process.env.TEST_EMAIL_2,
    password: process.env.TEST_PASSWORD_2,
  });
  if (si2.data?.user) {
    const otherUserReports = await D.from('reports').select('*').eq('id', rid);
    check('Akun kedua TIDAK bisa melihat laporan akun pertama (RLS)', (otherUserReports.data || []).length === 0);
    const deleteAttempt = await D.from('reports').delete().eq('id', rid);
    check('Akun kedua TIDAK bisa menghapus laporan akun pertama (RLS)', Boolean(deleteAttempt.error) || (deleteAttempt.data || []).length === 0);
    await D.auth.signOut();
  }
}

// 11. Ubah profil: uji update lalu pulihkan nama semula agar akun tetap bersih
const originalName = prof.data?.full_name || 'Warga TERANG';
const nm = await A.from('profiles').update({ full_name: `${originalName} (Uji)` }).eq('id', uid).select('full_name').single();
check('ubah nama profil', nm.data?.full_name === `${originalName} (Uji)`, nm.error?.message || '');
await A.from('profiles').update({ full_name: originalName }).eq('id', uid);

// 12. Logout
const so = await A.auth.signOut();
check('logout', !so.error);

// 13. Pembersihan HANYA pada data uji ini (laporan uji 'rid' dan foto uji 'path')
await B.storage.from('report-photos').remove([path]);
const del = await B.from('reports').delete().eq('id', rid);
check('bersihkan laporan uji saja (laporan pengguna lain aman)', !del.error, del.error?.message || '');
await B.auth.signOut();

const failed = results.filter((r) => !r[1]);
console.log(`\nRINGKASAN: ${results.length - failed.length}/${results.length} lulus. Akun uji: ${email}`);
process.exit(failed.length ? 4 : 0);

