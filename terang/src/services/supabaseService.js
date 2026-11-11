/**
 * Layanan data TERANG berbasis Supabase (Auth, profiles, reports, report_photos, Storage).
 * Mengikuti skema supabase/migrations/20261111_001_terang_backend.sql:
 *  - path foto: {auth.uid()}/{reports.id}/{nama-file}  (bucket private -> signed URL)
 *  - status/prioritas/owner/public_id dikelola server (trigger), tidak dikirim dari klien.
 */
import { supabase, REPORT_PHOTOS_BUCKET } from './supabaseClient';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 jam
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function initialsOf(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatIdDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function buildUser(authUser, profile) {
  const fullName =
    profile?.full_name ||
    authUser?.user_metadata?.full_name ||
    (authUser?.email ? authUser.email.split('@')[0] : 'Warga TERANG');
  return {
    id: authUser.id,
    fullName,
    email: authUser.email || '',
    isDemo: false,
    role: profile?.role || 'warga',
    initials: initialsOf(fullName),
    avatarUrl: null,
    reports: [],
  };
}

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .maybeSingle();
  return data || null;
}

/* ----------------------------- AUTH ----------------------------- */

export async function sbSignUp({ fullName, email, password }) {
  const cleanName = String(fullName || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: { data: { full_name: cleanName } },
  });

  if (error) {
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('already') || msg.includes('registered')) {
      return { ok: false, field: 'email', code: 'EMAIL_EXISTS', error: 'Email ini sudah terdaftar. Silakan masuk.' };
    }
    if (msg.includes('password')) {
      return { ok: false, field: 'password', code: 'WEAK_PASSWORD', error: 'Kata sandi belum memenuhi syarat keamanan.' };
    }
    if (msg.includes('rate') || error.status === 429) {
      return { ok: false, field: 'email', code: 'RATE_LIMIT', error: 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.' };
    }
    return { ok: false, field: 'email', code: 'API_ERROR', error: 'Gagal mendaftarkan akun. Coba lagi.' };
  }

  // Email sudah terdaftar (Supabase menyamarkan error): identities kosong
  if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { ok: false, field: 'email', code: 'EMAIL_EXISTS', error: 'Email ini sudah terdaftar. Silakan masuk.' };
  }

  // Verifikasi email aktif -> pendaftaran berhasil, belum ada sesi sampai verifikasi email selesai
  if (!data?.session) {
    return {
      ok: true,
      needsEmailVerification: true,
      code: 'EMAIL_VERIFICATION_REQUIRED',
      email: cleanEmail,
      user: null,
    };
  }

  const profile = await fetchProfile(data.user.id);
  return { ok: true, user: buildUser(data.user, profile) };
}

export async function sbSignIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || '').trim().toLowerCase(),
    password,
  });

  if (error) {
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('not confirmed')) {
      return { ok: false, field: 'email', code: 'EMAIL_NOT_CONFIRMED', error: 'Email belum diverifikasi. Periksa kotak masuk Anda.' };
    }
    if (error.status === 429 || msg.includes('rate')) {
      return { ok: false, field: 'password', code: 'RATE_LIMIT', error: 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.' };
    }
    if (msg.includes('invalid login')) {
      // Pesan generik agar tidak membocorkan apakah email terdaftar
      return { ok: false, field: 'password', code: 'API_ERROR', error: 'Email atau kata sandi salah.' };
    }
    return { ok: false, field: 'password', code: 'API_ERROR', error: 'Tidak dapat masuk saat ini. Coba lagi.' };
  }

  const profile = await fetchProfile(data.user.id);
  return { ok: true, user: buildUser(data.user, profile) };
}

export async function sbSignOut() {
  await supabase.auth.signOut();
}

export async function sbGetSessionUser() {
  const { data } = await supabase.auth.getSession();
  const authUser = data?.session?.user;
  if (!authUser) return null;
  const profile = await fetchProfile(authUser.id);
  return buildUser(authUser, profile);
}

export async function sbUpdateProfileName(userId, fullName) {
  const clean = String(fullName || '').trim();
  if (!clean) return { ok: false, error: 'Nama lengkap tidak boleh kosong.' };
  const { error } = await supabase.from('profiles').update({ full_name: clean }).eq('id', userId);
  if (error) return { ok: false, error: 'Gagal memperbarui profil.' };
  // Sinkronkan metadata Auth (non-kritis)
  await supabase.auth.updateUser({ data: { full_name: clean } }).catch(() => {});
  return { ok: true };
}

export async function sbChangePassword({ email, currentPassword, newPassword }) {
  const verify = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (verify.error) return { ok: false, error: 'Kata sandi saat ini salah.' };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { ok: false, error: 'Kata sandi baru ditolak. Gunakan kombinasi yang lebih kuat.' };
  }
  return { ok: true };
}

/* ----------------------------- REPORTS ----------------------------- */

async function signPaths(paths) {
  const map = {};
  const validPaths = (paths || []).filter(Boolean);
  if (validPaths.length === 0) return map;

  const { data, error } = await supabase.storage
    .from(REPORT_PHOTOS_BUCKET)
    .createSignedUrls(validPaths, SIGNED_URL_TTL_SECONDS);

  if (error || !Array.isArray(data)) return map;

  data.forEach((item, idx) => {
    const originalPath = validPaths[idx];
    if (item?.signedUrl) {
      if (item.path) map[item.path] = item.signedUrl;
      if (originalPath) map[originalPath] = item.signedUrl;
    }
  });

  return map;
}

function mapReportRow(row, signedMap) {
  const photos = (row.report_photos || [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((p) => ({
      id: p.id,
      name: p.file_name || `Foto ${p.position + 1}`,
      size: p.size_bytes || 0,
      storagePath: p.storage_path,
      previewUrl: signedMap[p.storage_path] || '',
    }));

  return {
    id: row.public_id,
    dbId: row.id,
    title: row.title,
    category: row.category,
    customCategory: row.custom_category || '',
    location: row.address,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    coordinates: `${Number(row.latitude).toFixed(6)}, ${Number(row.longitude).toFixed(6)}`,
    subdistrict: row.subdistrict,
    ward: row.ward || '',
    description: row.description,
    safetyImpact: row.safety_impact,
    reporterVisibility: row.reporter_visibility,
    status: row.status,
    priority: row.priority,
    createdAt: formatIdDate(row.created_at),
    createdAtIso: row.created_at,
    photoCount: photos.length,
    photoNames: photos.map((p) => p.name),
    photoPreviews: photos,
    photoUrl: photos[0]?.previewUrl || '',
    isDemoData: false,
  };
}

export async function sbFetchMyReports(userId) {
  const { data, error } = await supabase
    .from('reports')
    .select('*, report_photos(*)')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { ok: false, error: 'Gagal memuat laporan dari server.', reports: [] };

  const paths = (data || []).flatMap((r) => (r.report_photos || []).map((p) => p.storage_path));
  const signedMap = await signPaths(paths);
  return { ok: true, reports: (data || []).map((r) => mapReportRow(r, signedMap)) };
}

/**
 * Kirim laporan baru: insert reports -> upload foto -> insert report_photos.
 * Jika ada langkah foto yang gagal, laporan & file yang sudah terunggah dibatalkan (rollback)
 * sehingga tidak ada laporan "tanpa foto" yang diam-diam tersimpan.
 */
export async function sbCreateReport(userId, report, files) {
  const photoFiles = (files || []).filter(Boolean).slice(0, 3);

  for (const f of photoFiles) {
    if (!MIME_TO_EXT[f.type]) {
      return { ok: false, error: `Format foto "${f.name}" tidak didukung (gunakan JPG, PNG, atau WebP).` };
    }
    if (f.size > MAX_PHOTO_BYTES) {
      return { ok: false, error: `Ukuran foto "${f.name}" melebihi 5 MB.` };
    }
  }

  const { data: row, error: insertError } = await supabase
    .from('reports')
    .insert({
      owner_id: userId,
      category: report.category,
      custom_category: report.customCategory || null,
      title: report.title,
      address: report.address,
      latitude: report.latitude,
      longitude: report.longitude,
      subdistrict: report.subdistrict || 'Coblong',
      ward: report.ward || null,
      description: report.description,
      safety_impact: report.safetyImpact,
      reporter_visibility: report.reporterVisibility === 'nama' ? 'nama' : 'anonim',
    })
    .select('id, public_id')
    .single();

  if (insertError || !row) {
    return { ok: false, error: 'Laporan gagal disimpan ke server. Periksa data lalu coba lagi.' };
  }

  const uploadedPaths = [];
  const rollback = async () => {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(REPORT_PHOTOS_BUCKET).remove(uploadedPaths).catch(() => {});
    }
    await supabase.from('reports').delete().eq('id', row.id); // cascade ke report_photos
  };

  try {
    for (let i = 0; i < photoFiles.length; i += 1) {
      const file = photoFiles[i];
      const ext = MIME_TO_EXT[file.type] || 'jpg';
      const fileName = `${i}_${crypto.randomUUID()}.${ext}`;
      const path = `${row.id}/${fileName}`;

      const { error: upError } = await supabase.storage
        .from(REPORT_PHOTOS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upError) throw new Error('upload');
      uploadedPaths.push(path);

      const { error: metaError } = await supabase.from('report_photos').insert({
        report_id: row.id,
        owner_id: userId,
        storage_path: path,
        position: i,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (metaError) throw new Error('meta');
    }
  } catch {
    await rollback();
    return {
      ok: false,
      error: 'Foto gagal diunggah ke server, laporan dibatalkan. Periksa koneksi lalu coba kirim ulang.',
    };
  }

  return { ok: true, publicId: row.public_id, dbId: row.id };
}
