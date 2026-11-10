import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserInitials, deduplicateReports } from '../services/authService';
import './DashboardPage.css';

const DASHBOARD_NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', type: 'route' },
  { key: 'peta-laporan', label: 'Peta Laporan', href: '/peta-laporan', type: 'route' },
  { key: 'transparansi', label: 'Transparansi', href: '/transparansi', type: 'route' },
  { key: 'laporan-saya', label: 'Laporan Saya', href: '/laporan-saya', type: 'route' },
];

export default function DashboardPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [emptyIconError, setEmptyIconError] = useState(false);
  const dropdownRef = useRef(null);

  // Nama dan inisial avatar diambil secara dinamis dari akun yang sedang login
  const displayName =
    user?.fullName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Warga TERANG');
  const avatarInitials = user?.initials || getUserInitials(displayName);
  const avatarUrl = user?.avatarUrl || null;
  const userReports = deduplicateReports(Array.isArray(user?.reports) ? user.reports : []);

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

  const handleNavClick = (e, item) => {
    e.preventDefault();
    setActiveNav(item.key);

    if (item.type === 'route') {
      navigate(item.href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (item.type === 'anchor') {
      const el = document.querySelector(item.href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (item.type === 'landing-section') {
      navigate('/');
      setTimeout(() => {
        const hash = item.href.replace('/', '');
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
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
    <div className="dashboard-page">
      {/* Authenticated Top Navbar */}
      <header className="dashboard-navbar">
        <div className="dashboard-navbar-inner">
          <a
            href="/"
            className="dashboard-brand-link"
            onClick={handleBrandClick}
            aria-label="TERANG — Kembali ke Beranda"
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

          {/* Navigation After Login: Dashboard, Peta Laporan, Transparansi, Laporan Saya */}
          <nav aria-label="Navigasi Dashboard Warga">
            <ul className="dashboard-nav-center">
              {DASHBOARD_NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    className={`dashboard-nav-item ${
                      activeNav === item.key ? 'active' : ''
                    }`}
                    aria-current={activeNav === item.key ? 'page' : undefined}
                    onClick={(e) => handleNavClick(e, item)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Dynamic User Profile & Logout Menu */}
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
                    setActiveNav('dashboard');
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
                  className="dashboard-dropdown-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/profil');
                  }}
                >
                  <span>Profil Saya</span>
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

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Yellow Greeting Banner */}
        <section
          className="dashboard-greeting-banner"
          aria-labelledby="dashboard-greeting-heading"
        >
          <h1 id="dashboard-greeting-heading" className="dashboard-greeting-title">
            Halo, {displayName}!
          </h1>
          <p className="dashboard-greeting-subtitle">
            Ada kerusakan di sekitarmu? Mulai buat laporan dan pantau perkembangannya.
          </p>
          <button
            type="button"
            className="dashboard-cta-btn"
            onClick={() => navigate('/buat-laporan')}
          >
            Buat Laporan
          </button>
        </section>

        {/* Laporan Saya Section */}
        <section
          id="laporan-saya"
          className="dashboard-reports-card"
          aria-labelledby="laporan-saya-heading"
        >
          <h2 id="laporan-saya-heading" className="dashboard-reports-heading">
            Laporan Saya
          </h2>

          {userReports.length === 0 ? (
            <div className="dashboard-empty-box">
              {!emptyIconError ? (
                <img
                  src="/images/sun-confused.png"
                  alt="Ilustrasi belum ada laporan"
                  className="dashboard-empty-icon"
                  width="92"
                  height="100"
                  onError={() => setEmptyIconError(true)}
                />
              ) : (
                <img
                  src="/sun-terang.png"
                  alt=""
                  className="dashboard-empty-icon"
                  width="76"
                  height="76"
                  aria-hidden="true"
                />
              )}
              <h3 className="dashboard-empty-title">Kamu belum membuat laporan.</h3>
              <p className="dashboard-empty-desc">
                Laporan pertamamu akan muncul di sini setelah dikirim.
              </p>
            </div>
          ) : (
            <ul className="dashboard-report-list">
              {userReports.map((item, idx) => {
                const thumbUrl =
                  item.photoUrl || item.photoPreviews?.[0]?.previewUrl || '';
                const reportId = item.id || `TRG-${idx + 1}`;
                return (
                  <li
                    key={reportId}
                    className="dashboard-report-item"
                  >
                    <div className="dashboard-report-left">
                      {thumbUrl && (
                        <img
                          src={thumbUrl}
                          alt={`Foto laporan ${reportId}`}
                          className="dashboard-report-thumb"
                        />
                      )}
                      <div className="dashboard-report-item-main">
                        <div className="dashboard-report-top-row">
                          <span className="dashboard-report-id">
                            {reportId}
                          </span>
                          {item.category && (
                            <span className="dashboard-report-category">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <h3 className="dashboard-report-title">
                          {item.title ||
                            item.category ||
                            'Laporan Fasilitas Publik'}
                        </h3>
                        {(item.location || item.address) && (
                          <p className="dashboard-report-location">
                            {item.location || item.address}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="dashboard-report-meta">
                      <span className="dashboard-report-status">
                        {item.status || 'Menunggu Verifikasi'}
                      </span>
                      {item.createdAt && (
                        <span className="dashboard-report-date">
                          {item.createdAt}
                        </span>
                      )}
                      {item.id && (
                        <Link
                          to={`/laporan/${encodeURIComponent(item.id)}`}
                          state={{ from: '/dashboard#laporan-saya', fromLabel: 'Laporan Saya' }}
                          className="dashboard-report-detail-link"
                        >
                          Lihat Detail Laporan →
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="dashboard-privacy-note">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <span>Identitas pelapor terlindungi secara terenkripsi.</span>
          </div>
        </section>
      </main>
    </div>
  );
}
