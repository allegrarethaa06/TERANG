/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  IS_DEMO_MODE,
  readDemoSession,
  registerWithBackend,
  loginWithBackend,
  loginAsDemoWarga,
  fetchActiveSession,
  logoutFromBackend,
  savePendingRedirect,
  consumePendingRedirect,
  saveDemoUserReport,
  updateDemoUserProfile,
  changeDemoUserPassword,
} from '../services/authService';
import { IS_SUPABASE_ENABLED, supabase } from '../services/supabaseClient';
import {
  sbSignUp,
  sbSignIn,
  sbSignOut,
  sbGetSessionUser,
  sbUpdateProfileName,
  sbChangePassword,
  sbFetchMyReports,
  sbCreateReport,
} from '../services/supabaseService';

const AuthContext = createContext(null);

// Signed URL foto berlaku 1 jam; segarkan lebih awal agar foto tidak kedaluwarsa
const REPORTS_REFRESH_INTERVAL_MS = 45 * 60 * 1000;

export function AuthProvider({ children }) {
  // Mode Supabase: sesi dipulihkan async (authLoading). Mode demo: sinkron dari sessionStorage.
  const [user, setUser] = useState(() => (IS_SUPABASE_ENABLED ? null : readDemoSession()));
  const [authLoading, setAuthLoading] = useState(IS_SUPABASE_ENABLED);
  const userIdRef = useRef(null);

  const loadReportsInto = useCallback(async (baseUser) => {
    const res = await sbFetchMyReports(baseUser.id);
    return { ...baseUser, reports: res.reports, reportsError: res.ok ? '' : res.error };
  }, []);

  useEffect(() => {
    let active = true;

    if (IS_SUPABASE_ENABLED) {
      (async () => {
        try {
          const baseUser = await sbGetSessionUser();
          if (!active) return;
          if (baseUser) {
            const full = await loadReportsInto(baseUser);
            if (!active) return;
            userIdRef.current = full.id;
            setUser(full);
          }
        } catch {
          // Abaikan: pengguna dianggap belum login
        } finally {
          if (active) setAuthLoading(false);
        }
      })();

      // Hanya tangani SIGNED_OUT (mis. dari tab lain / token dicabut). Jangan memanggil
      // Supabase di dalam callback ini agar tidak terjadi deadlock.
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          userIdRef.current = null;
          setUser(null);
        }
      });
      return () => {
        active = false;
        sub?.subscription?.unsubscribe();
      };
    }

    fetchActiveSession().then((res) => {
      if (active && res && res.ok && res.user) {
        setUser(res.user);
      }
    });
    return () => {
      active = false;
    };
  }, [loadReportsInto]);

  const refreshReports = useCallback(async () => {
    if (!IS_SUPABASE_ENABLED || !userIdRef.current) return null;
    const res = await sbFetchMyReports(userIdRef.current);
    if (res.ok) {
      setUser((prev) => (prev ? { ...prev, reports: res.reports, reportsError: '' } : prev));
    }
    return res;
  }, []);

  // Segarkan signed URL secara berkala selama sesi aktif
  useEffect(() => {
    if (!IS_SUPABASE_ENABLED || !user?.id) return undefined;
    const timer = setInterval(() => {
      refreshReports();
    }, REPORTS_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user?.id, refreshReports]);

  const register = useCallback(
    async (credentials) => {
      if (IS_SUPABASE_ENABLED) {
        const result = await sbSignUp(credentials);
        if (result.ok && result.user) {
          const full = await loadReportsInto(result.user);
          userIdRef.current = full.id;
          setUser(full);
          return { ...result, user: full };
        }
        return result;
      }
      const result = await registerWithBackend(credentials);
      if (result && result.ok && result.user) {
        setUser(result.user);
      }
      return result;
    },
    [loadReportsInto]
  );

  const login = useCallback(
    async (credentials) => {
      if (IS_SUPABASE_ENABLED) {
        const result = await sbSignIn(credentials);
        if (result.ok && result.user) {
          const full = await loadReportsInto(result.user);
          userIdRef.current = full.id;
          setUser(full);
          return { ...result, user: full };
        }
        return result;
      }
      const result = await loginWithBackend(credentials);
      if (result && result.ok && result.user) {
        setUser(result.user);
      }
      return result;
    },
    [loadReportsInto]
  );

  const loginDemo = useCallback(async (options = {}) => {
    if (IS_SUPABASE_ENABLED) {
      return { ok: false, error: 'Mode demo tidak tersedia saat backend aktif.' };
    }
    const result = await loginAsDemoWarga(options);
    if (result && result.ok && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    if (IS_SUPABASE_ENABLED) {
      userIdRef.current = null;
      setUser(null);
      await sbSignOut();
      return;
    }
    await logoutFromBackend();
    setUser(null);
  }, []);

  // Mode demo: simpan lokal (sinkron). Dipertahankan untuk fallback tanpa Supabase.
  const addUserReport = useCallback((newReport) => {
    if (!newReport) return;
    setUser((prev) => {
      if (!prev) return prev;
      const updatedReports = saveDemoUserReport(prev.email, newReport);
      return {
        ...prev,
        reports: updatedReports,
      };
    });
  }, []);

  /**
   * Kirim laporan beserta file foto asli.
   * Supabase: insert reports + upload Storage + insert report_photos (dengan rollback).
   * Demo: simpan lokal seperti sebelumnya.
   * Mengembalikan { ok, report?, error? }.
   */
  const submitReport = useCallback(
    async (report, files = []) => {
      if (!IS_SUPABASE_ENABLED) {
        addUserReport(report);
        return { ok: true, report };
      }
      const uid = userIdRef.current;
      if (!uid) {
        return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' };
      }
      const created = await sbCreateReport(uid, report, files);
      if (!created.ok) return created;

      const refreshed = await sbFetchMyReports(uid);
      if (refreshed.ok) {
        setUser((prev) => (prev ? { ...prev, reports: refreshed.reports, reportsError: '' } : prev));
        const saved = refreshed.reports.find((r) => r.id === created.publicId);
        return { ok: true, report: saved || { ...report, id: created.publicId } };
      }
      return { ok: true, report: { ...report, id: created.publicId } };
    },
    [addUserReport]
  );

  const updateProfile = useCallback(
    async ({ fullName }) => {
      if (!fullName || !fullName.trim()) {
        return { ok: false, error: 'Nama lengkap tidak boleh kosong.' };
      }
      const cleanName = fullName.trim();
      if (IS_SUPABASE_ENABLED) {
        if (!user?.id) return { ok: false, error: 'Sesi akun tidak aktif.' };
        const res = await sbUpdateProfileName(user.id, cleanName);
        if (!res.ok) return res;
        const initials = cleanName
          .split(/\s+/)
          .filter(Boolean)
          .map((p, i, arr) => (arr.length === 1 ? p.slice(0, 2) : i === 0 || i === arr.length - 1 ? p[0] : ''))
          .join('')
          .toUpperCase();
        const updatedUser = { ...user, fullName: cleanName, initials: initials || user.initials };
        setUser(updatedUser);
        return { ok: true, user: updatedUser };
      }
      if (!user?.email) {
        return { ok: false, error: 'Sesi akun tidak aktif.' };
      }
      const updatedUser = updateDemoUserProfile({
        email: user.email,
        fullName: cleanName,
      });
      if (updatedUser) {
        setUser(updatedUser);
        return { ok: true, user: updatedUser };
      }
      return { ok: false, error: 'Gagal memperbarui profil.' };
    },
    [user]
  );

  const changePassword = useCallback(
    async ({ currentPassword, newPassword }) => {
      if (!user?.email) {
        return { ok: false, error: 'Sesi akun tidak aktif.' };
      }
      if (IS_SUPABASE_ENABLED) {
        return sbChangePassword({ email: user.email, currentPassword, newPassword });
      }
      return changeDemoUserPassword({
        email: user.email,
        currentPassword,
        newPassword,
      });
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user),
      isDemoMode: IS_SUPABASE_ENABLED ? false : IS_DEMO_MODE,
      isSupabaseEnabled: IS_SUPABASE_ENABLED,
      register,
      login,
      loginDemo,
      logout,
      addUserReport,
      submitReport,
      refreshReports,
      updateProfile,
      changePassword,
      savePendingRedirect,
      consumePendingRedirect,
    }),
    [
      user,
      authLoading,
      register,
      login,
      loginDemo,
      logout,
      addUserReport,
      submitReport,
      refreshReports,
      updateProfile,
      changePassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam <AuthProvider>.');
  }
  return ctx;
}
