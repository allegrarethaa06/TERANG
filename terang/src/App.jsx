import { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import Hero from './components/Hero';
import CaraKerja from './components/CaraKerja';
import RadarRusakLagi from './components/RadarRusakLagi';
import JejakPanel from './components/JejakPanel';
import Footer from './components/Footer';
import ReportDetailModal from './components/ReportDetailModal';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import BuatLaporanPage from './components/BuatLaporanPage';
import LaporanTerkirimPage from './components/LaporanTerkirimPage';
import DetailLaporanPage from './components/DetailLaporanPage';
import PetaLaporanPage from './components/PetaLaporanPage';
import TransparansiPage from './components/TransparansiPage';
import LaporanSayaPage from './components/LaporanSayaPage';
import ProfilPage from './components/ProfilPage';
import { SAMPLE_REPORTS } from './data/reportsData';
import { useAuth } from './context/AuthContext';
import './App.css';

function ScrollToTopOnRoute() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Perbaikan wajib 6: Lindungi halaman pribadi (/dashboard, /laporan-saya, /buat-laporan, /profil)
// Pengunjung tanpa sesi diarahkan ke /masuk dengan menyimpan tujuan redirect
function ProtectedRoute({ redirectPath, children }) {
  const { isAuthenticated, savePendingRedirect } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && redirectPath) {
      savePendingRedirect(redirectPath);
    }
  }, [isAuthenticated, redirectPath, savePendingRedirect]);

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/masuk?redirect=${encodeURIComponent(redirectPath)}`}
        replace
      />
    );
  }
  return children;
}

// Setelah autentikasi berhasil (dari /masuk atau /daftar), arahkan ke tujuan redirect atau /dashboard
function AuthenticatedRedirect() {
  const [searchParams] = useSearchParams();
  const { consumePendingRedirect } = useAuth();
  const target = consumePendingRedirect(searchParams.get('redirect'), '/dashboard');
  return <Navigate to={target} replace />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedReport, setSelectedReport] = useState(null);
  const {
    user: currentUser,
    isAuthenticated,
    isDemoMode,
    authLoading,
    register,
    login,
    logout,
    savePendingRedirect,
  } = useAuth();

  // Jika pengguna kembali ke Landing Page (/), akhiri sesi demo dengan aman
  // agar saat menekan Masuk pengguna bisa login kembali.
  // Akun demo dan data laporan yang tersimpan tidak akan terhapus.
  // Untuk sesi Supabase produksi, sesi tetap dipertahankan.
  useEffect(() => {
    if (location.pathname === '/' && isAuthenticated && isDemoMode) {
      logout();
    }
  }, [location.pathname, isAuthenticated, isDemoMode, logout]);

  const featuredReport = SAMPLE_REPORTS[0];

  const handleLogoClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Perbaikan wajib 7: Jika pengguna menekan "Buat Laporan" sebelum login -> simpan tujuan /buat-laporan dan arahkan ke /masuk
  const handleCreateReport = () => {
    if (!isAuthenticated) {
      savePendingRedirect('/buat-laporan');
      navigate('/masuk?redirect=/buat-laporan');
      return;
    }

    navigate('/buat-laporan');
  };

  const handleAuthAction = (routePath) => {
    navigate(routePath);
  };

  const landingView = (
    <div className="terang-app">
      <main className="landing-main">
        {/* Hero Full-Screen + Navbar (SELALU Navbar Publik) */}
        <Hero
          onCreateReport={handleCreateReport}
          onAuthAction={handleAuthAction}
          onLogoClick={handleLogoClick}
        />

        {/* Section 01: Cara Kerja */}
        <CaraKerja />

        {/* Section 02: Radar Rusak Lagi (Peta Laporan Publik) */}
        <RadarRusakLagi
          onSelectReport={setSelectedReport}
          report={featuredReport}
        />

        {/* Section 03: Transparansi (Jejak Keputusan & Anggaran Publik) */}
        <JejakPanel
          onSelectReport={setSelectedReport}
          report={featuredReport}
        />
      </main>

      {/* Footer */}
      <Footer onLogoClick={handleLogoClick} />

      {/* Detail Laporan Simulasi (TRG-024) */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );

  // Tunggu pemulihan sesi Supabase agar refresh halaman pribadi tidak salah redirect
  if (authLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', sans-serif",
          color: '#271A62',
        }}
      >
        Memuat…
      </div>
    );
  }

  return (
    <>
      <ScrollToTopOnRoute />
      <Routes>
        {/* Halaman Publik (Landing Page, Peta Laporan, Transparansi) */}
        <Route path="/" element={landingView} />
        <Route
          path="/peta-laporan"
          element={<PetaLaporanPage user={currentUser} onLogout={logout} />}
        />
        <Route
          path="/transparansi"
          element={<TransparansiPage user={currentUser} onLogout={logout} />}
        />

        {/* Halaman Autentikasi */}
        <Route
          path="/masuk"
          element={
            isAuthenticated ? (
              <AuthenticatedRedirect />
            ) : (
              <LoginPage onAuthenticate={login} />
            )
          }
        />
        <Route
          path="/daftar"
          element={
            isAuthenticated ? (
              <AuthenticatedRedirect />
            ) : (
              <RegisterPage onRegister={register} />
            )
          }
        />

        {/* Halaman Pribadi Warga (Dilindungi ProtectedRoute) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute redirectPath="/dashboard">
              <DashboardPage user={currentUser} onLogout={logout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/laporan-saya"
          element={
            <ProtectedRoute redirectPath="/laporan-saya">
              <LaporanSayaPage user={currentUser} onLogout={logout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buat-laporan"
          element={
            <ProtectedRoute redirectPath="/buat-laporan">
              <BuatLaporanPage user={currentUser} onLogout={logout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/laporan-terkirim"
          element={
            <ProtectedRoute redirectPath="/dashboard">
              <LaporanTerkirimPage user={currentUser} onLogout={logout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/laporan/:reportId"
          element={<DetailLaporanPage user={currentUser} onLogout={logout} />}
        />
        <Route
          path="/profil"
          element={
            <ProtectedRoute redirectPath="/profil">
              <ProfilPage user={currentUser} onLogout={logout} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
