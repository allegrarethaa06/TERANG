import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInitials } from '../services/authService';

const PUBLIC_NAV_LINKS = [
  { key: 'cara-kerja', label: 'Cara Kerja', href: '#cara-kerja', type: 'scroll' },
  { key: 'peta-laporan', label: 'Peta Laporan', href: '#peta-laporan', type: 'scroll' },
  { key: 'transparansi', label: 'Transparansi', href: '#transparansi', type: 'scroll' },
];

// Alur wajib 5: Navbar setelah login -> Dashboard, Peta Laporan, Transparansi, Laporan Saya, dan Profil pengguna
const AUTH_NAV_LINKS = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', type: 'route' },
  { key: 'peta-laporan', label: 'Peta Laporan', href: '#peta-laporan', type: 'scroll' },
  { key: 'transparansi', label: 'Transparansi', href: '#transparansi', type: 'scroll' },
  { key: 'laporan-saya', label: 'Laporan Saya', href: '/laporan-saya', type: 'route' },
];

export default function Navbar({
  onAuthAction,
  onLogoClick,
  user = null,
  onLogout,
  isPublic = true,
}) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeKey, setActiveKey] = useState('');
  const [logoError, setLogoError] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const profileDropdownRef = useRef(null);

  // Landing Page harus SELALU menggunakan navbar publik
  const isAuthenticated = !isPublic && Boolean(user);
  const navLinks = isAuthenticated ? AUTH_NAV_LINKS : PUBLIC_NAV_LINKS;
  const displayName =
    user?.fullName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Warga TERANG');
  const avatarInitials = user?.initials || getUserInitials(displayName);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < 240) {
        setActiveKey('');
        return;
      }
      let current = '';
      for (const item of navLinks) {
        if (item.type === 'scroll') {
          const el = document.querySelector(item.href);
          if (el && el.getBoundingClientRect().top <= 180) {
            current = item.key;
          }
        }
      }
      setActiveKey(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navLinks]);

  useEffect(() => {
    if (!mobileMenuOpen && !profileMenuOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };
    const handleClickOutside = (e) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target)
      ) {
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen, profileMenuOpen]);

  const handleBrandClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setActiveKey('');
    if (onLogoClick) {
      onLogoClick();
    } else {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavClick = (e, item) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setActiveKey(item.key);

    if (item.type === 'route') {
      navigate(item.href);
      return;
    }

    if (window.location.pathname !== '/') {
      navigate('/');
    }
    const target = document.querySelector(item.href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const triggerAuthRoute = (routePath) => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    if (onAuthAction) {
      onAuthAction(routePath);
    } else {
      navigate(routePath);
    }
  };

  const handleLogoutClick = async () => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    if (typeof onLogout === 'function') {
      await onLogout();
    }
    navigate('/', { replace: true });
  };

  return (
    <header className="landing-navbar">
      <div className="landing-navbar-inner">
        <a
          href="/"
          className="navbar-brand-link"
          onClick={handleBrandClick}
          aria-label="TERANG — Kembali ke Landing Page"
        >
          {!logoError ? (
            <img
              src="/logo-terang.png"
              alt="TERANG"
              className="navbar-brand-logo"
              width="164"
              height="37"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="navbar-brand-fallback">TERANG</span>
          )}
        </a>

        {/* Desktop Pill Navigation */}
        <nav className="navbar-pill" aria-label="Navigasi Utama">
          <ul className="navbar-links">
            {navLinks.map((item) => (
              <li key={item.key}>
                <a
                  href={item.href}
                  className={`navbar-link ${activeKey === item.key ? 'active' : ''}`}
                  aria-current={activeKey === item.key ? 'location' : undefined}
                  onClick={(e) => handleNavClick(e, item)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {!isAuthenticated ? (
            <div className="navbar-auth-group">
              <button
                type="button"
                className="navbar-btn navbar-btn-masuk"
                onClick={() => triggerAuthRoute('/masuk')}
              >
                Masuk
              </button>
              <button
                type="button"
                className="navbar-btn navbar-btn-daftar"
                onClick={() => triggerAuthRoute('/daftar')}
              >
                Daftar
              </button>
            </div>
          ) : (
            <div className="dashboard-profile-wrap" ref={profileDropdownRef}>
              <button
                type="button"
                className={`dashboard-profile-trigger ${profileMenuOpen ? 'open' : ''}`}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                aria-label={`Menu profil ${displayName}`}
              >
                <span className="dashboard-avatar" aria-hidden="true">
                  {user?.avatarUrl && !avatarImgError ? (
                    <img
                      src={user.avatarUrl}
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
          )}
        </nav>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          className="navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        >
          <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
          <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
          <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu" role="dialog" aria-label="Menu Navigasi Mobile">
          <ul className="navbar-mobile-links">
            {navLinks.map((item) => (
              <li key={item.key}>
                <a
                  href={item.href}
                  className={`navbar-mobile-link ${activeKey === item.key ? 'active' : ''}`}
                  onClick={(e) => handleNavClick(e, item)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          {!isAuthenticated ? (
            <div className="navbar-mobile-actions">
              <button
                type="button"
                className="navbar-btn navbar-btn-masuk"
                onClick={() => triggerAuthRoute('/masuk')}
              >
                Masuk
              </button>
              <button
                type="button"
                className="navbar-btn navbar-btn-daftar"
                onClick={() => triggerAuthRoute('/daftar')}
              >
                Daftar
              </button>
            </div>
          ) : (
            <div className="navbar-mobile-actions">
              <button
                type="button"
                className="navbar-btn navbar-btn-masuk"
                onClick={() => triggerAuthRoute('/dashboard')}
              >
                {displayName}
              </button>
              <button
                type="button"
                className="navbar-btn navbar-btn-daftar"
                onClick={handleLogoutClick}
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
