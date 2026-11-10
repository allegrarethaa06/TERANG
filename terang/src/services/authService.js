/**
 * Layanan Autentikasi TERANG
 *
 * Pemisahan Tanggung Jawab:
 * - Logika API Produksi (ketika VITE_API_BASE_URL dikonfigurasi) berada di file ini.
 * - Logika Akun & Sesi Demo Lokal (Salted SHA-256 Hash via Web Crypto) berada di `./demoAuthService.js`.
 */

import {
  getUserInitials,
  readDemoSession,
  registerDemoAccount,
  verifyDemoAccountLogin,
  createDemoSessionForLogin,
  clearDemoSession,
  savePendingRedirect,
  consumePendingRedirect,
  saveDemoUserReport,
  normalizeReportId,
  deduplicateReports,
  updateDemoUserProfile,
  changeDemoUserPassword,
} from './demoAuthService';

export {
  getUserInitials,
  readDemoSession,
  savePendingRedirect,
  consumePendingRedirect,
  saveDemoUserReport,
  normalizeReportId,
  deduplicateReports,
  updateDemoUserProfile,
  changeDemoUserPassword,
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, '')
  : '';

export const IS_DEMO_MODE = !API_BASE_URL;

/**
 * Normalisasi objek profil pengguna dari respons API
 */
export function normalizeUserProfile(rawUser) {
  if (!rawUser || typeof rawUser !== 'object') return null;

  const fullName =
    rawUser.fullName ||
    rawUser.full_name ||
    rawUser.name ||
    (rawUser.email ? rawUser.email.split('@')[0] : '');

  if (!fullName && !rawUser.email) return null;

  return {
    id: rawUser.id || rawUser.userId || null,
    fullName: String(fullName).trim(),
    email: rawUser.email ? String(rawUser.email).trim() : '',
    isDemo: Boolean(rawUser.isDemo),
    avatarUrl: rawUser.avatarUrl || rawUser.avatar_url || null,
    initials: getUserInitials(fullName),
    reports: Array.isArray(rawUser.reports) ? rawUser.reports : [],
  };
}

/**
 * Registrasi Akun Baru
 * - Dalam Mode Demo: menyimpan akun demo lokal menggunakan salted password hash (Web Crypto)
 *   tanpa menyimpan password mentah, lalu langsung mengaktifkan sesi pengguna.
 * - Dalam Mode API: mengirim ke server backend dan mengembalikan sesi terautentikasi.
 */
export async function registerWithBackend({ fullName, email, password }) {
  if (IS_DEMO_MODE) {
    return registerDemoAccount({ fullName, email, password });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        field: payload.field || 'email',
        code: 'API_ERROR',
        error:
          payload.message ||
          payload.error ||
          'Gagal mendaftarkan akun. Periksa kembali data Anda.',
      };
    }

    let user = normalizeUserProfile(
      payload.user || payload.data?.user || payload.data
    );

    if (!user) {
      const loginResult = await loginWithBackend({ email, password });
      if (loginResult && loginResult.ok && loginResult.user) {
        user = loginResult.user;
      }
    }

    if (user && !user.fullName && fullName.trim()) {
      user = normalizeUserProfile({ ...user, fullName: fullName.trim() });
    }

    if (!user) {
      return {
        ok: false,
        code: 'INVALID_SESSION',
        error: 'Pendaftaran belum menghasilkan sesi pengguna yang valid.',
      };
    }

    return {
      ok: true,
      user,
    };
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      error: 'Tidak dapat terhubung ke layanan autentikasi.',
    };
  }
}

/**
 * Login Formulir Email & Kata Sandi
 * - Dalam Mode Demo: memverifikasi email & password terhadap akun demo lokal menggunakan salted hash Web Crypto.
 *   Jika email belum terdaftar -> kode EMAIL_NOT_FOUND.
 *   Jika password salah -> kode WRONG_PASSWORD.
 */
export async function loginWithBackend({ email, password }) {
  if (IS_DEMO_MODE) {
    return verifyDemoAccountLogin({ email, password });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        field: payload.field || 'password',
        code: payload.code || 'API_ERROR',
        error:
          payload.message ||
          payload.error ||
          'Kata sandi salah. Silakan coba lagi.',
      };
    }

    const user = normalizeUserProfile(payload.user || payload.data || payload);
    if (!user) {
      return {
        ok: false,
        code: 'INVALID_USER_PAYLOAD',
        error: 'Respons profil pengguna tidak valid.',
      };
    }

    return {
      ok: true,
      user,
    };
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      error: 'Tidak dapat terhubung ke layanan autentikasi.',
    };
  }
}

/**
 * Masuk instan melalui link sekunder "Masuk sebagai Warga Demo"
 */
export async function loginAsDemoWarga({ email } = {}) {
  return createDemoSessionForLogin({ email });
}

/**
 * Mengambil sesi pengguna aktif saat halaman dimuat ulang (refresh)
 */
export async function fetchActiveSession() {
  const demoUser = readDemoSession();
  if (demoUser) {
    return { ok: true, user: demoUser };
  }

  if (IS_DEMO_MODE) {
    return { ok: false, user: null };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return { ok: false, user: null };
    }

    const payload = await response.json().catch(() => ({}));
    const user = normalizeUserProfile(payload.user || payload.data || payload);
    return {
      ok: Boolean(user),
      user,
    };
  } catch {
    return { ok: false, user: null };
  }
}

/**
 * Mengakhiri sesi pengguna (menghapus sesi aktif dari sessionStorage)
 */
export async function logoutFromBackend() {
  clearDemoSession();

  if (IS_DEMO_MODE) {
    return { ok: true };
  }

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Sesi klien sudah dibersihkan
  }

  return { ok: true };
}
