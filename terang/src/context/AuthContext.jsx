/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Inisialisasi sinkron dari sessionStorage agar refresh halaman mempertahankan sesi demo tanpa kedipan redirect
  const [user, setUser] = useState(() => readDemoSession());

  useEffect(() => {
    let active = true;
    fetchActiveSession().then((res) => {
      if (active && res && res.ok && res.user) {
        setUser(res.user);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const register = useCallback(async (credentials) => {
    const result = await registerWithBackend(credentials);
    if (result && result.ok && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await loginWithBackend(credentials);
    if (result && result.ok && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const loginDemo = useCallback(async (options = {}) => {
    const result = await loginAsDemoWarga(options);
    if (result && result.ok && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutFromBackend();
    setUser(null);
  }, []);

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

  const updateProfile = useCallback(async ({ fullName }) => {
    if (!fullName || !fullName.trim()) {
      return { ok: false, error: 'Nama lengkap tidak boleh kosong.' };
    }
    const cleanName = fullName.trim();
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
  }, [user]);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    if (!user?.email) {
      return { ok: false, error: 'Sesi akun tidak aktif.' };
    }
    return changeDemoUserPassword({
      email: user.email,
      currentPassword,
      newPassword,
    });
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isDemoMode: IS_DEMO_MODE,
      register,
      login,
      loginDemo,
      logout,
      addUserReport,
      updateProfile,
      changePassword,
      savePendingRedirect,
      consumePendingRedirect,
    }),
    [user, register, login, loginDemo, logout, addUserReport, updateProfile, changePassword]
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
