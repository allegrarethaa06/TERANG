import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserInitials } from '../services/authService';

export default function AppNavbar({
  user = null,
  onLogout,
  onBrandClick = null,
  currentPage = '',
  className = '',
}) {
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const isAuthenticated = Boolean(user);
  const displayName =
    user?.fullName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Warga TERANG');
  const avatarInitials = user?.initials || getUserInitials(displayName);
  const avatarUrl = user?.avatarUrl || null;

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
    return undefined;
  }, [mobileMenuOpen]);

  // Handle outside click & escape key
  useEffect(() => {
    if (!profileMenuOpen && !mobileMenuOpen) return undefined;

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setProfileMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !e.target.closest('.dashboard-mobile-toggle')
      ) {
        setMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen, mobileMenuOpen]);

  const handleBrandClick = async (e) => {
    e.preventDefault();
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    if (typeof onBrandClick === 'function') {
      await onBrandClick(e);
      return;
    }
    if (isAuthenticated && typeof onLogout === 'function') {
      await onLogout();
    }
    navigate('/', { replace: true });
  };

  const handleLogoutClick = async () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    if (typeof onLogout === 'function') {
      await onLogout();
    }
    navigate('/', { replace: true });
  };

  const closeMenus = () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className={`dashboard-navbar ${className}`.trim()}>
      <div className="dashboard-navbar-inner">
        {/* Brand Logo */}
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

        {/* Center Desktop Navigation */}
        <nav aria-label="Navigasi Utama">
          <ul className="dashboard-nav-center">
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className={`dashboard-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
                    aria-current={currentPage === 'dashboard' ? 'page' : undefined}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/peta-laporan"
                    className={`dashboard-nav-item ${currentPage === 'peta-laporan' ? 'active' : ''}`}
                    aria-current={currentPage === 'peta-laporan' ? 'page' : undefined}
                  >
                    Peta Laporan
                  </Link>
                </li>
                <li>
                  <Link
                    to="/transparansi"
                    className={`dashboard-nav-item ${currentPage === 'transparansi' ? 'active' : ''}`}
                    aria-current={currentPage === 'transparansi' ? 'page' : undefined}
                  >
                    Transparansi
                  </Link>
                </li>
                <li>
                  <Link
                    to="/laporan-saya"
                    className={`dashboard-nav-item ${currentPage === 'laporan-saya' ? 'active' : ''}`}
                    aria-current={currentPage === 'laporan-saya' ? 'page' : undefined}
                  >
                    Laporan Saya
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/"
                    className={`dashboard-nav-item ${currentPage === 'beranda' ? 'active' : ''}`}
                    aria-current={currentPage === 'beranda' ? 'page' : undefined}
                  >
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link
                    to="/peta-laporan"
                    className={`dashboard-nav-item ${currentPage === 'peta-laporan' ? 'active' : ''}`}
                    aria-current={currentPage === 'peta-laporan' ? 'page' : undefined}
                  >
                    Peta Laporan
                  </Link>
                </li>
                <li>
                  <Link
                    to="/transparansi"
                    className={`dashboard-nav-item ${currentPage === 'transparansi' ? 'active' : ''}`}
                    aria-current={currentPage === 'transparansi' ? 'page' : undefined}
                  >
                    Transparansi
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Desktop Profile / Auth Action */}
        <div className="dashboard-navbar-right-desktop">
          {isAuthenticated ? (
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
                      closeMenus();
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
                      closeMenus();
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
                      closeMenus();
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
          ) : (
            <div className="dashboard-guest-actions">
              <Link to="/masuk" className="dashboard-guest-link">
                Masuk
              </Link>
              <Link to="/daftar" className="dashboard-guest-btn">
                Daftar
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="dashboard-mobile-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        >
          <span className={`dashboard-hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
          <span className={`dashboard-hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
          <span className={`dashboard-hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
        </button>
      </div>

      {/* Mobile Backdrop & Drawer Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="dashboard-mobile-backdrop"
            onClick={closeMenus}
            aria-label="Tutup menu navigasi"
          />
          <aside
            className="dashboard-mobile-drawer"
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu Navigasi Mobile"
          >
            {/* Drawer Header with Title and Close 'X' Button */}
            <div className="dashboard-mobile-drawer-header">
              <span className="dashboard-mobile-drawer-title">
                Menu Navigasi
              </span>
              <button
                type="button"
                className="dashboard-mobile-close-btn"
                onClick={closeMenus}
                aria-label="Tutup menu"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="dashboard-mobile-drawer-content">
              {isAuthenticated ? (
                <>
                  {/* User Account Card */}
                  <div className="dashboard-mobile-user-card">
                    <span className="dashboard-avatar dashboard-avatar-mobile" aria-hidden="true">
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
                    <div className="dashboard-mobile-user-info">
                      <span className="dashboard-mobile-user-name">{displayName}</span>
                      {user?.email && (
                        <span className="dashboard-mobile-user-email">{user.email}</span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Nav Links */}
                  <ul className="dashboard-mobile-nav-list">
                    <li>
                      <Link
                        to="/dashboard"
                        className={`dashboard-mobile-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span>Dashboard</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/peta-laporan"
                        className={`dashboard-mobile-nav-item ${currentPage === 'peta-laporan' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span>Peta Laporan</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/transparansi"
                        className={`dashboard-mobile-nav-item ${currentPage === 'transparansi' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span>Transparansi</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/laporan-saya"
                        className={`dashboard-mobile-nav-item ${currentPage === 'laporan-saya' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span>Laporan Saya</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/profil"
                        className={`dashboard-mobile-nav-item ${currentPage === 'profil' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span>Profil Saya</span>
                      </Link>
                    </li>
                  </ul>

                  {/* Action Buttons */}
                  <div className="dashboard-mobile-actions">
                    <Link
                      to="/buat-laporan"
                      className="dashboard-mobile-btn-primary"
                      onClick={closeMenus}
                    >
                      + Buat Laporan
                    </Link>
                    <button
                      type="button"
                      className="dashboard-mobile-btn-logout"
                      onClick={handleLogoutClick}
                    >
                      Keluar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Guest Mobile Nav Links */}
                  <ul className="dashboard-mobile-nav-list">
                    <li>
                      <Link
                        to="/"
                        className={`dashboard-mobile-nav-item ${currentPage === 'beranda' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span>Beranda</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/peta-laporan"
                        className={`dashboard-mobile-nav-item ${currentPage === 'peta-laporan' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span>Peta Laporan</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/transparansi"
                        className={`dashboard-mobile-nav-item ${currentPage === 'transparansi' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span>Transparansi</span>
                      </Link>
                    </li>
                  </ul>

                  {/* Guest Actions */}
                  <div className="dashboard-mobile-actions dashboard-mobile-actions-guest">
                    <Link
                      to="/masuk"
                      className="dashboard-mobile-btn-secondary"
                      onClick={closeMenus}
                    >
                      Masuk
                    </Link>
                    <Link
                      to="/daftar"
                      className="dashboard-mobile-btn-primary"
                      onClick={closeMenus}
                    >
                      Daftar
                    </Link>
                  </div>
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
