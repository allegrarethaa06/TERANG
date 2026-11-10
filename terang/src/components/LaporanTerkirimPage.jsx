import { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { getUserInitials } from '../services/authService';
import './DashboardPage.css';
import './LaporanTerkirimPage.css';

export const LAST_SUBMITTED_REPORT_ID_KEY = 'terang_last_submitted_report_id_v1';

// Revisi 1: Menu "Beranda" diganti menjadi "Dashboard" pada navbar pengguna login.
// Tidak ada highlight aktif pada menu Dashboard ketika berada di halaman sukses.
const SUCCESS_NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', type: 'route' },
  {
    key: 'peta-laporan',
    label: 'Peta Laporan',
    href: '/peta-laporan',
    type: 'route',
  },
  {
    key: 'transparansi',
    label: 'Transparansi',
    href: '/transparansi',
    type: 'route',
  },
  {
    key: 'laporan-saya',
    label: 'Laporan Saya',
    href: '/laporan-saya',
    type: 'route',
  },
];

export default function LaporanTerkirimPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const dropdownRef = useRef(null);

  const displayName =
    user?.fullName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Warga TERANG');
  const avatarInitials = user?.initials || getUserInitials(displayName);
  const avatarUrl = user?.avatarUrl || null;

  // Cari laporan yang baru saja disimpan berdasarkan query ?id=... atau sessionStorage
  const userReports = Array.isArray(user?.reports) ? user.reports : [];
  const queryReportId = searchParams.get('id');
  const storedLastId =
    typeof window !== 'undefined' && window.sessionStorage
      ? window.sessionStorage.getItem(LAST_SUBMITTED_REPORT_ID_KEY)
      : null;
  const targetReportId = queryReportId || storedLastId;

  const submittedReport = targetReportId
    ? userReports.find((item) => item && item.id === targetReportId) || null
    : userReports[0] || null;

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  // Revisi 9: Halaman sukses hanya tampil setelah laporan berhasil disimpan dalam mekanisme demo.
  if (!submittedReport) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleNavClick = (e, item) => {
    e.preventDefault();

    if (item.type === 'route') {
      navigate(item.href);
      return;
    }

    if (item.type === 'dashboard-anchor') {
      navigate('/dashboard');
      setTimeout(() => {
        const el = document.querySelector('#laporan-saya');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return;
    }

    if (item.type === 'landing-section') {
      navigate('/');
      setTimeout(() => {
        const hash = item.href.replace('/', '');
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  };

  const handleLogoutClick = async () => {
    setProfileMenuOpen(false);
    if (typeof onLogout === 'function') {
      await onLogout();
    }
    navigate('/', { replace: true });
  };

  const handleBrandClick = async (e) => {
    e.preventDefault();
    if (typeof onLogout === 'function') {
      await onLogout();
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="laporan-sukses-page">
      {/* Navbar Pengguna Login (tanpa highlight aktif pada menu Dashboard) */}
      <header className="dashboard-navbar">
        <div className="dashboard-navbar-inner">
          <a
            href="/"
            className="dashboard-brand-link"
            onClick={handleBrandClick}
            aria-label="TERANG — Kembali ke Halaman Utama"
          >
            {!logoError ? (
              <img
                src="/logo-terang.png"
                alt="TERANG"
                className="dashboard-brand-logo"
                width="148"
                height="33"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="dashboard-brand-fallback">TERANG</span>
            )}
          </a>

          <nav aria-label="Navigasi Utama Warga">
            <ul className="dashboard-nav-center">
              {SUCCESS_NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    className="dashboard-nav-item"
                    onClick={(e) => handleNavClick(e, item)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="dashboard-profile-wrap" ref={dropdownRef}>
            <button
              type="button"
              className={`dashboard-profile-trigger ${profileMenuOpen ? 'open' : ''}`}
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              aria-label={`Menu profil ${displayName}`}
            >
              <span className="dashboard-avatar" aria-hidden="true">
                {avatarUrl && !avatarImgError ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="dashboard-avatar-img"
                    onError={() => setAvatarImgError(true)}
                  />
                ) : (
                  <span>{avatarInitials}</span>
                )}
              </span>
              <span className="dashboard-profile-name">{displayName}</span>
              <svg
                className={`dashboard-profile-chevron ${profileMenuOpen ? 'open' : ''}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {profileMenuOpen && (
              <div
                className="dashboard-profile-dropdown"
                role="menu"
                aria-label="Menu Akun Warga"
              >
                <div className="dashboard-dropdown-header">
                  <div className="dashboard-dropdown-name">{displayName}</div>
                  {user?.email && (
                    <div className="dashboard-dropdown-email">{user.email}</div>
                  )}
                </div>

                <button
                  type="button"
                  role="menuitem"
                  className="dashboard-dropdown-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                >
                  <span>Dashboard Warga</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className="dashboard-dropdown-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/laporan-saya');
                  }}
                >
                  <span>Laporan Saya</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className="dashboard-dropdown-item dashboard-dropdown-logout"
                  onClick={handleLogoutClick}
                >
                  <span>Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Centered Success Content */}
      <main className="laporan-sukses-main">
        <section
          className="laporan-sukses-content"
          aria-labelledby="laporan-sukses-heading"
        >
          {/* Revisi 2: Karakter CAYA tersenyum dari aset PNG transparan asli */}
          <img
            src="/images/caya-happy.png"
            alt="Karakter CAYA tersenyum"
            className="laporan-sukses-caya"
            width="136"
            height="144"
          />

          {/* Revisi 4: Headline & Deskripsi */}
          <h1 id="laporan-sukses-heading" className="laporan-sukses-title">
            Laporan berhasil dikirim!
          </h1>
          <p className="laporan-sukses-desc">
            Laporanmu sudah tercatat dan menunggu pemeriksaan admin.
          </p>

          {/* Revisi 5: ID Laporan & Status "Menunggu Verifikasi" dinamis */}
          <div
            className="laporan-sukses-status-pill"
            aria-label={`ID Laporan ${submittedReport.id}, status ${
              submittedReport.status || 'Menunggu Verifikasi'
            }`}
          >
            <span className="laporan-sukses-id">{submittedReport.id}</span>
            <span className="laporan-sukses-dot" aria-hidden="true">
              •
            </span>
            <span className="laporan-sukses-status">
              {submittedReport.status || 'Menunggu Verifikasi'}
            </span>
          </div>

          <p className="laporan-sukses-helper">
            Pantau perkembangan laporanmu melalui Laporan Saya.
          </p>

          {/* Revisi 6 & 7: Tombol utama "Lihat Detail Laporan" & link sekunder "Kembali ke Dashboard" */}
          <div className="laporan-sukses-actions">
            <button
              type="button"
              className="laporan-sukses-primary-btn"
              onClick={() =>
                navigate(`/laporan/${encodeURIComponent(submittedReport.id)}`, {
                  state: { from: '/dashboard', fromLabel: 'Dashboard' },
                })
              }
            >
              Lihat Detail Laporan
            </button>

            <Link to="/dashboard" className="laporan-sukses-dashboard-link">
              Kembali ke Dashboard
            </Link>
          </div>

          {/* Revisi 10: Keterangan halus "Data simulasi" */}
          <span className="laporan-sukses-simulasi-note">
            Data simulasi • Disimpan pada sesi browser ini
          </span>
        </section>
      </main>
    </div>
  );
}
