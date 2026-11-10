/**
 * Layanan Akun & Sesi Demo Lokal TERANG (Khusus Prototipe Frontend)
 *
 * Prinsip Keamanan Prototipe:
 * - Akun demo yang didaftarkan melalui /daftar disimpan secara lokal menggunakan
 *   Salted Password Hash (Web Crypto API SHA-256 + 16-byte random salt).
 * - TIDAK PERNAH menyimpan kata sandi mentah (plaintext password).
 * - Sesi aktif di sessionStorage hanya menyimpan { fullName, email, isDemo: true }.
 * - Sistem ini hanya untuk prototipe UI/UX, bukan autentikasi produksi.
 */

const DEMO_SESSION_KEY = 'terang_demo_session';
const DEMO_ACCOUNTS_KEY = 'terang_demo_accounts_v1';
const DEMO_REDIRECT_KEY = 'terang_demo_redirect';
const DEMO_REPORTS_KEY = 'terang_demo_user_reports_v1';

/**
 * Mengubah ArrayBuffer / Uint8Array menjadi string heksadesimal
 */
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Membuat salt acak 16-byte menggunakan Web Crypto API
 */
function generateSaltHex() {
  const bytes = new Uint8Array(16);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytesToHex(bytes);
}

/**
 * Menghitung Salted SHA-256 Hash menggunakan Web Crypto API (crypto.subtle.digest)
 */
export async function hashPasswordWithSalt(password, saltHex) {
  const input = `${saltHex}:${String(password)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    return bytesToHex(new Uint8Array(hashBuffer));
  }

  // Fallback deterministik hanya jika lingkungan non-browser tidak memiliki subtle crypto
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

/**
 * Menghasilkan inisial avatar secara dinamis dari nama lengkap pengguna
 */
export function getUserInitials(fullName = '') {
  const cleaned = String(fullName || '').trim();
  if (!cleaned) return 'WD';

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Normalisasi ID Laporan (menghapus tanda # di depan dan spasi)
 */
export function normalizeReportId(id) {
  if (!id) return '';
  return String(id).trim().replace(/^#+/, '');
}

/**
 * Deduplikasi daftar laporan berdasarkan ID unik
 */
export function deduplicateReports(reportsList) {
  if (!Array.isArray(reportsList)) return [];
  const seenIds = new Set();
  const result = [];
  for (const item of reportsList) {
    if (!item) continue;
    const norm = normalizeReportId(item.id);
    if (norm) {
      if (seenIds.has(norm)) continue;
      seenIds.add(norm);
    }
    result.push(item);
  }
  return result;
}

/**
 * Membaca daftar laporan demo milik akun email tertentu
 */
export function readDemoUserReports(email = '') {
  if (typeof window === 'undefined') return [];
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return [];

  try {
    let combined = [];

    // Baca dari localStorage
    try {
      if (window.localStorage) {
        const rawLocal = window.localStorage.getItem(DEMO_REPORTS_KEY);
        if (rawLocal) {
          const parsedLocal = JSON.parse(rawLocal);
          if (parsedLocal && Array.isArray(parsedLocal[cleanEmail])) {
            combined = [...combined, ...parsedLocal[cleanEmail]];
          }
        }
      }
    } catch {
      // Ignore
    }

    // Baca dari sessionStorage
    try {
      if (window.sessionStorage) {
        const rawSession = window.sessionStorage.getItem(DEMO_REPORTS_KEY);
        if (rawSession) {
          const parsedSession = JSON.parse(rawSession);
          if (parsedSession && Array.isArray(parsedSession[cleanEmail])) {
            combined = [...combined, ...parsedSession[cleanEmail]];
          }
        }
      }
    } catch {
      // Ignore
    }

    const deduplicated = deduplicateReports(combined);

    // Sinkronisasi kembali data bersih ke kedua storage jika terdapat duplikasi sebelumnya
    if (combined.length !== deduplicated.length) {
      try {
        const syncMap = (storage) => {
          if (!storage) return;
          const raw = storage.getItem(DEMO_REPORTS_KEY);
          const map = raw ? JSON.parse(raw) : {};
          map[cleanEmail] = deduplicated;
          storage.setItem(DEMO_REPORTS_KEY, JSON.stringify(map));
        };
        syncMap(window.localStorage);
        syncMap(window.sessionStorage);
      } catch {
        // Ignore
      }
    }

    return deduplicated;
  } catch {
    return [];
  }
}

/**
 * Menyimpan laporan baru ke daftar laporan demo milik akun yang sedang login
 */
export function saveDemoUserReport(email, reportItem) {
  if (typeof window === 'undefined' || !reportItem) return [];
  const cleanEmail = String(email || '').trim().toLowerCase() || 'warga.demo@terang.id';

  try {
    const existing = readDemoUserReports(cleanEmail);
    const newNormId = normalizeReportId(reportItem.id);

    // Jika ID laporan sudah ada, perbarui atau abaikan duplikasi
    let updated;
    const existingIndex = existing.findIndex(
      (r) => r && normalizeReportId(r.id) === newNormId
    );

    if (existingIndex >= 0) {
      // Sudah ada, gantikan versi terbaru pada posisi yang sama tanpa menambah item
      updated = [...existing];
      updated[existingIndex] = { ...existing[existingIndex], ...reportItem };
    } else {
      // Belum ada, tambahkan di paling depan
      updated = deduplicateReports([reportItem, ...existing]);
    }

    // Simpan ke localStorage & sessionStorage
    const saveToStorage = (storage, items) => {
      if (!storage) return;
      const raw = storage.getItem(DEMO_REPORTS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const map = parsed && typeof parsed === 'object' ? parsed : {};
      map[cleanEmail] = items;
      try {
        storage.setItem(DEMO_REPORTS_KEY, JSON.stringify(map));
      } catch {
        // Fallback jika kuota dataUrl foto penuh
        const compact = items.map((r) => ({
          ...r,
          photoPreviews: Array.isArray(r.photoPreviews)
            ? r.photoPreviews.slice(0, 1)
            : [],
        }));
        map[cleanEmail] = compact;
        storage.setItem(DEMO_REPORTS_KEY, JSON.stringify(map));
      }
    };

    saveToStorage(window.localStorage, updated);
    saveToStorage(window.sessionStorage, updated);

    return updated;
  } catch {
    return [reportItem];
  }
}

/**
 * Membentuk objek user aktif untuk AuthContext, Dashboard, dan Navbar
 */
export function buildDemoUserObject({ fullName, email }) {
  const cleanName = String(fullName || '').trim() || 'Warga Demo';
  const cleanEmail = String(email || '').trim().toLowerCase() || 'warga.demo@terang.id';

  return {
    fullName: cleanName,
    email: cleanEmail,
    isDemo: true,
    initials: getUserInitials(cleanName),
    avatarUrl: null,
    reports: readDemoUserReports(cleanEmail),
  };
}

/**
 * Membaca daftar akun demo lokal (hanya berisi fullName, email, salt, passwordHash)
 */
function readStoredDemoAccounts() {
  if (typeof window === 'undefined') return [];

  try {
    const storage = window.localStorage || window.sessionStorage;
    if (!storage) return [];
    const raw = storage.getItem(DEMO_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Menyimpan daftar akun demo lokal (tanpa password mentah)
 */
function writeStoredDemoAccounts(accounts) {
  if (typeof window === 'undefined') return;

  try {
    const storage = window.localStorage || window.sessionStorage;
    if (!storage) return;
    storage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Abaikan jika storage penuh
  }
}

/**
 * Membaca sesi demo aktif dari sessionStorage (dipertahankan saat refresh halaman)
 */
export function readDemoSession() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.isDemo !== true || !parsed.fullName || !parsed.email) {
      return null;
    }

    return buildDemoUserObject({
      fullName: parsed.fullName,
      email: parsed.email,
    });
  } catch {
    return null;
  }
}

/**
 * Menyimpan sesi demo aktif ke sessionStorage (HANYA fullName, email, dan isDemo: true)
 */
function writeDemoSession({ fullName, email }) {
  const cleanName = String(fullName || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (typeof window !== 'undefined' && window.sessionStorage) {
    const safePayload = {
      fullName: cleanName,
      email: cleanEmail,
      isDemo: true,
    };
    window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(safePayload));
  }

  return buildDemoUserObject({ fullName: cleanName, email: cleanEmail });
}

/**
 * Memperbarui nama profil akun pengguna yang sedang login
 */
export function updateDemoUserProfile({ email, fullName }) {
  const cleanName = String(fullName || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanName || !cleanEmail) return null;

  // 1. Perbarui catatan akun yang tersimpan jika ada di daftar akun demo
  const accounts = readStoredDemoAccounts();
  const idx = accounts.findIndex(
    (acc) => String(acc.email || '').toLowerCase() === cleanEmail
  );
  if (idx >= 0) {
    accounts[idx] = {
      ...accounts[idx],
      fullName: cleanName,
      updatedAt: new Date().toISOString(),
    };
    writeStoredDemoAccounts(accounts);
  }

  // 2. Perbarui sesi aktif di sessionStorage
  return writeDemoSession({ fullName: cleanName, email: cleanEmail });
}

/**
 * Mengubah kata sandi akun demo lokal menggunakan salted SHA-256 hash
 */
export async function changeDemoUserPassword({ email, currentPassword, newPassword }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { ok: false, error: 'Sesi akun tidak valid.' };
  }

  const accounts = readStoredDemoAccounts();
  const matched = accounts.find(
    (acc) => String(acc.email || '').toLowerCase() === cleanEmail
  );

  // Jika akun tidak ditemukan dalam akun terdaftar (misal sesi tamu instan tanpa kata sandi awal)
  if (!matched || !matched.salt || !matched.passwordHash) {
    return {
      ok: false,
      isDemoGuest: true,
      error: 'Fitur ubah kata sandi belum tersedia pada sesi tamu demo instan tanpa kata sandi awal. Silakan daftar akun baru melalui halaman Daftar untuk menguji fitur ini.',
    };
  }

  // Verifikasi kata sandi saat ini
  const candidateHash = await hashPasswordWithSalt(currentPassword, matched.salt);
  if (candidateHash !== matched.passwordHash) {
    return {
      ok: false,
      field: 'currentPassword',
      error: 'Kata sandi saat ini salah. Silakan coba lagi.',
    };
  }

  // Validasi minimal 8 karakter
  if (!newPassword || String(newPassword).length < 8) {
    return {
      ok: false,
      field: 'newPassword',
      error: 'Kata sandi baru minimal 8 karakter.',
    };
  }

  // Hitung salt dan passwordHash baru
  const newSalt = generateSaltHex();
  const newPasswordHash = await hashPasswordWithSalt(newPassword, newSalt);

  matched.salt = newSalt;
  matched.passwordHash = newPasswordHash;
  matched.updatedAt = new Date().toISOString();

  writeStoredDemoAccounts(accounts);

  return {
    ok: true,
    message: 'Kata sandi berhasil diperbarui.',
  };
}

/**
 * Registrasi Akun Demo Lokal melalui /daftar:
 * - Menghitung salted SHA-256 password hash melalui Web Crypto API.
 * - Menyimpan akun ke daftar akun demo lokal tanpa password mentah.
 * - Langsung membuat sesi aktif di sessionStorage agar pengguna langsung masuk ke /dashboard.
 */
export async function registerDemoAccount({ fullName, email, password }) {
  const cleanName = String(fullName || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();

  const salt = generateSaltHex();
  const passwordHash = await hashPasswordWithSalt(password, salt);

  const accounts = readStoredDemoAccounts();
  const existingIndex = accounts.findIndex(
    (acc) => String(acc.email || '').toLowerCase() === cleanEmail
  );

  const accountRecord = {
    fullName: cleanName,
    email: cleanEmail,
    salt,
    passwordHash,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    accounts[existingIndex] = accountRecord;
  } else {
    accounts.push(accountRecord);
  }

  writeStoredDemoAccounts(accounts);

  const user = writeDemoSession({
    fullName: cleanName,
    email: cleanEmail,
  });

  return {
    ok: true,
    isDemo: true,
    user,
  };
}

/**
 * Verifikasi Login Akun Demo Lokal melalui /masuk:
 * - Jika email belum terdaftar -> kembalikan kode EMAIL_NOT_FOUND ("Email ini belum terdaftar. Daftar dulu, yuk!").
 * - Jika kata sandi tidak cocok dengan salted hash -> kembalikan kode WRONG_PASSWORD ("Kata sandi salah. Silakan coba lagi.").
 * - Jika cocok -> buat sesi aktif di sessionStorage dan kembalikan profil pengguna.
 */
export async function verifyDemoAccountLogin({ email, password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const accounts = readStoredDemoAccounts();

  const matchedAccount = accounts.find(
    (acc) => String(acc.email || '').toLowerCase() === cleanEmail
  );

  if (!matchedAccount) {
    return {
      ok: false,
      field: 'email',
      code: 'EMAIL_NOT_FOUND',
      error: 'Email ini belum terdaftar.',
    };
  }

  const candidateHash = await hashPasswordWithSalt(password, matchedAccount.salt);
  if (candidateHash !== matchedAccount.passwordHash) {
    return {
      ok: false,
      field: 'password',
      code: 'WRONG_PASSWORD',
      error: 'Kata sandi salah. Silakan coba lagi.',
    };
  }

  const user = writeDemoSession({
    fullName: matchedAccount.fullName,
    email: matchedAccount.email,
  });

  return {
    ok: true,
    isDemo: true,
    user,
  };
}

/**
 * Membuat sesi instan melalui link sekunder "Masuk sebagai Warga Demo"
 */
export function createDemoSessionForLogin({ email } = {}) {
  const trimmedEmail = String(email || '').trim().toLowerCase();
  const accounts = readStoredDemoAccounts();

  if (trimmedEmail) {
    const matched = accounts.find(
      (acc) => String(acc.email || '').toLowerCase() === trimmedEmail
    );
    if (matched) {
      const user = writeDemoSession({
        fullName: matched.fullName,
        email: matched.email,
      });
      return { ok: true, isDemo: true, user };
    }
  }

  const user = writeDemoSession({
    fullName: 'Warga Demo',
    email: 'warga.demo@terang.id',
  });

  return {
    ok: true,
    isDemo: true,
    user,
  };
}

/**
 * Menghapus sesi aktif dari sessionStorage saat tombol Keluar diklik
 * (Daftar akun yang sudah didaftarkan tetap tersimpan agar pengguna bisa login kembali dengan email & password yang sama)
 */
export function clearDemoSession() {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
    window.sessionStorage.removeItem(DEMO_REDIRECT_KEY);
  }
}

/**
 * Menyimpan tujuan halaman pribadi (misal: /buat-laporan) sebelum autentikasi
 */
export function savePendingRedirect(path) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  if (path && typeof path === 'string' && path.startsWith('/')) {
    window.sessionStorage.setItem(DEMO_REDIRECT_KEY, path);
  }
}

/**
 * Mengambil dan menghapus tujuan redirect yang tersimpan
 */
export function consumePendingRedirect(queryRedirect, fallback = '/dashboard') {
  let target = queryRedirect || null;

  if (typeof window !== 'undefined' && window.sessionStorage) {
    const stored = window.sessionStorage.getItem(DEMO_REDIRECT_KEY);
    window.sessionStorage.removeItem(DEMO_REDIRECT_KEY);
    if (!target && stored) {
      target = stored;
    }
  }

  if (target && typeof target === 'string' && target.startsWith('/')) {
    return target;
  }

  return fallback;
}
