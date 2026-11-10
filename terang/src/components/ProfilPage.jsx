import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserInitials } from '../services/authService';
import './DashboardPage.css';
import './ProfilPage.css';

function ShieldIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function UserIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PencilIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function KeyIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m21 2-2 2m-1.5 1.5L13 10m-3-3a5 5 0 1 0 7 7l5-5-2-2-2 2-2-2-2 2-2-2" />
    </svg>
  );
}

function EyeIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function ProfilPage({ user, onLogout }) {
  const navigate = useNavigate();
  const { updateProfile, changePassword } = useAuth();
  const dropdownRef = useRef(null);

  // Navbar states
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);

  // Data pengguna dinamis
  const displayName =
    user?.fullName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Warga TERANG');
  const displayEmail = user?.email || 'warga.demo@terang.id';
  const avatarInitials = user?.initials || getUserInitials(displayName);
  const avatarUrl = user?.avatarUrl || null;

  // Edit Profil states
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [nameFeedback, setNameFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Modal Ubah Kata Sandi states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwFeedback, setPwFeedback] = useState(null); // { type: 'success' | 'error' | 'info', message: string }
  const [isPwSubmitting, setIsPwSubmitting] = useState(false);

  // Handle click outside dropdown
  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

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

  // Mulai edit nama
  const handleStartEdit = () => {
    setNameInput(displayName);
    setNameFeedback(null);
    setIsEditingName(true);
  };

  // Batalkan edit nama
  const handleCancelEdit = () => {
    setNameInput(displayName);
    setNameFeedback(null);
    setIsEditingName(false);
  };

  // Simpan perubahan nama
  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameFeedback({
        type: 'error',
        message: 'Nama lengkap tidak boleh kosong.',
      });
      return;
    }

    if (typeof updateProfile === 'function') {
      const res = await updateProfile({ fullName: trimmed });
      if (res && res.ok) {
        setNameFeedback({
          type: 'success',
          message: 'Nama lengkap profil berhasil diperbarui.',
        });
        setIsEditingName(false);
        setTimeout(() => setNameFeedback(null), 4000);
      } else {
        setNameFeedback({
          type: 'error',
          message: res?.error || 'Gagal menyimpan perubahan nama.',
        });
      }
    } else {
      setIsEditingName(false);
    }
  };

  // Buka Modal Ubah Kata Sandi
  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setPwFeedback(null);
    setIsPasswordModalOpen(true);
  };

  // Tutup Modal Ubah Kata Sandi
  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPwFeedback(null);
  };

  // Submit Ubah Kata Sandi
  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setPwFeedback(null);

    if (!currentPassword) {
      setPwFeedback({
        type: 'error',
        message: 'Kata sandi saat ini harus diisi.',
      });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPwFeedback({
        type: 'error',
        message: 'Kata sandi baru minimal 8 karakter.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwFeedback({
        type: 'error',
        message: 'Konfirmasi kata sandi baru tidak cocok.',
      });
      return;
    }

    if (newPassword === currentPassword) {
      setPwFeedback({
        type: 'error',
        message: 'Kata sandi baru harus berbeda dari kata sandi saat ini.',
      });
      return;
    }

    setIsPwSubmitting(true);
    try {
      if (typeof changePassword === 'function') {
        const result = await changePassword({
          currentPassword,
          newPassword,
        });

        if (result && result.ok) {
          setPwFeedback({
            type: 'success',
            message: 'Kata sandi berhasil diperbarui!',
          });
          setTimeout(() => {
            handleClosePasswordModal();
          }, 1500);
        } else {
          setPwFeedback({
            type: result?.isDemoGuest ? 'info' : 'error',
            message:
              result?.error ||
              'Gagal mengubah kata sandi. Periksa kembali data yang dimasukkan.',
          });
        }
      }
    } catch {
      setPwFeedback({
        type: 'error',
        message: 'Terjadi kesalahan sistem saat memperbarui kata sandi.',
      });
    } finally {
      setIsPwSubmitting(false);
    }
  };

  return (
    <div className="profil-page">
      {/* Top Authenticated Navbar */}
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

          {/* Navigation After Login */}
          <nav aria-label="Navigasi Utama">
            <ul className="dashboard-nav-center">
              <li>
                <Link to="/dashboard" className="dashboard-nav-item">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/peta-laporan" className="dashboard-nav-item">
                  Peta Laporan
                </Link>
              </li>
              <li>
                <Link to="/transparansi" className="dashboard-nav-item">
                  Transparansi
                </Link>
              </li>
              <li>
                <Link to="/laporan-saya" className="dashboard-nav-item">
                  Laporan Saya
                </Link>
              </li>
            </ul>
          </nav>

          {/* Profile Dropdown */}
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
                  className="dashboard-dropdown-item active"
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

      {/* Main Profile Content */}
      <main className="profil-main">
        <div className="profil-container">
          {/* Header Title */}
          <header className="profil-header">
            <h1 className="profil-title">Profil Saya</h1>
            <p className="profil-subtitle">
              Kelola informasi akun dan keamanan kamu.
            </p>
          </header>

          {/* Profile Banner Card */}
          <section className="profil-banner-card" aria-label="Identitas Profil">
            <div className="profil-banner-accent" aria-hidden="true" />
            <div className="profil-banner-body">
              <div className="profil-banner-left">
                <div className="profil-avatar-large" aria-hidden="true">
                  {avatarUrl && !avatarImgError ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="profil-avatar-large-img"
                      onError={() => setAvatarImgError(true)}
                    />
                  ) : (
                    <span>{avatarInitials}</span>
                  )}
                </div>
                <div className="profil-banner-info">
                  <h2 className="profil-banner-name">{displayName}</h2>
                  <div className="profil-role-badge">
                    <ShieldIcon size={13} />
                    <span>Akun Warga</span>
                  </div>
                </div>
              </div>

              <div className="profil-banner-right">
                <button
                  type="button"
                  className="profil-btn-edit"
                  onClick={handleStartEdit}
                  disabled={isEditingName}
                >
                  <PencilIcon size={14} />
                  <span>Edit Profil</span>
                </button>
              </div>
            </div>
          </section>

          {/* Two-Column Grid: Informasi Pribadi & Keamanan Akun */}
          <div className="profil-grid">
            {/* Kolom Kiri: Informasi Pribadi */}
            <section
              className="profil-card"
              aria-labelledby="heading-info-pribadi"
            >
              <div className="profil-card-header">
                <div className="profil-card-title-row">
                  <span className="profil-card-icon" aria-hidden="true">
                    <UserIcon size={19} />
                  </span>
                  <h2
                    id="heading-info-pribadi"
                    className="profil-card-title"
                  >
                    Informasi Pribadi
                  </h2>
                </div>
                <p className="profil-card-desc">
                  Data ini tampil di akunmu. Klik Edit Profil untuk mengubah nama.
                </p>
              </div>

              {/* Feedback Notifikasi */}
              {nameFeedback && (
                <div
                  className={`profil-alert profil-alert--${nameFeedback.type}`}
                  role="status"
                >
                  <span>{nameFeedback.message}</span>
                </div>
              )}

              <div className="profil-card-form">
                {/* Field 1: Nama Lengkap */}
                <div className="profil-field">
                  <label htmlFor="profil-name-field" className="profil-label">
                    Nama Lengkap
                  </label>
                  {isEditingName ? (
                    <input
                      id="profil-name-field"
                      type="text"
                      className="profil-input profil-input--editing"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      autoFocus
                    />
                  ) : (
                    <div id="profil-name-field" className="profil-value-box">
                      {displayName}
                    </div>
                  )}
                </div>

                {/* Field 2: Email (Read Only) */}
                <div className="profil-field">
                  <label htmlFor="profil-email-field" className="profil-label">
                    Email
                  </label>
                  <div id="profil-email-field" className="profil-value-box profil-value-box--disabled">
                    {displayEmail}
                  </div>
                  <span className="profil-helper-text">
                    Email tidak dapat diubah.
                  </span>
                </div>

                {/* Tombol Simpan & Batal (Muncul hanya saat mode edit) */}
                {isEditingName && (
                  <div className="profil-edit-actions">
                    <button
                      type="button"
                      className="profil-btn-save"
                      onClick={handleSaveName}
                    >
                      Simpan Perubahan
                    </button>
                    <button
                      type="button"
                      className="profil-btn-cancel"
                      onClick={handleCancelEdit}
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Kolom Kanan: Keamanan Akun */}
            <section
              className="profil-card"
              aria-labelledby="heading-keamanan-akun"
            >
              <div className="profil-card-header">
                <div className="profil-card-title-row">
                  <span className="profil-card-icon" aria-hidden="true">
                    <ShieldIcon size={19} />
                  </span>
                  <h2
                    id="heading-keamanan-akun"
                    className="profil-card-title"
                  >
                    Keamanan Akun
                  </h2>
                </div>
              </div>

              <div className="profil-security-box">
                <div className="profil-security-left">
                  <div className="profil-key-icon-wrap" aria-hidden="true">
                    <KeyIcon size={20} />
                  </div>
                  <div className="profil-security-text">
                    <h3 className="profil-security-title">Ubah Kata Sandi</h3>
                    <p className="profil-security-desc">
                      Perbarui kata sandi secara berkala agar akunmu tetap aman.
                    </p>
                  </div>
                </div>

                <div className="profil-security-right">
                  <button
                    type="button"
                    className="profil-btn-change-pw"
                    onClick={handleOpenPasswordModal}
                  >
                    Ubah Kata Sandi
                  </button>
                </div>
              </div>

              <p className="profil-security-helper">
                Gunakan minimal 8 karakter dengan kombinasi huruf besar, huruf
                kecil, angka, dan simbol.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Modal Ubah Kata Sandi */}
      {isPasswordModalOpen && (
        <div
          className="profil-modal-overlay"
          onClick={handleClosePasswordModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-password-title"
        >
          <div
            className="profil-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profil-modal-header">
              <div>
                <h2 id="modal-password-title" className="profil-modal-title">
                  Ubah Kata Sandi
                </h2>
                <p className="profil-modal-subtitle">
                  Perbarui kata sandi akunmu demi keamanan akses.
                </p>
              </div>
              <button
                type="button"
                className="profil-modal-close"
                onClick={handleClosePasswordModal}
                aria-label="Tutup modal"
              >
                ×
              </button>
            </div>

            {/* Alert / Feedback di dalam modal */}
            {pwFeedback && (
              <div
                className={`profil-alert profil-alert--${pwFeedback.type}`}
                role="status"
              >
                <span>{pwFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPassword} className="profil-modal-form">
              {/* Kata Sandi Saat Ini */}
              <div className="profil-field">
                <label
                  htmlFor="pw-current-input"
                  className="profil-label"
                >
                  Kata Sandi Saat Ini
                </label>
                <div className="profil-input-pw-wrap">
                  <input
                    id="pw-current-input"
                    type={showCurrentPw ? 'text' : 'password'}
                    className="profil-input profil-input--pw"
                    placeholder="Masukkan kata sandi saat ini"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="profil-pw-toggle"
                    onClick={() => setShowCurrentPw((prev) => !prev)}
                    aria-label={
                      showCurrentPw
                        ? 'Sembunyikan kata sandi'
                        : 'Tampilkan kata sandi'
                    }
                  >
                    {showCurrentPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>

              {/* Kata Sandi Baru */}
              <div className="profil-field">
                <label
                  htmlFor="pw-new-input"
                  className="profil-label"
                >
                  Kata Sandi Baru
                </label>
                <div className="profil-input-pw-wrap">
                  <input
                    id="pw-new-input"
                    type={showNewPw ? 'text' : 'password'}
                    className="profil-input profil-input--pw"
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="profil-pw-toggle"
                    onClick={() => setShowNewPw((prev) => !prev)}
                    aria-label={
                      showNewPw
                        ? 'Sembunyikan kata sandi'
                        : 'Tampilkan kata sandi'
                    }
                  >
                    {showNewPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Kata Sandi Baru */}
              <div className="profil-field">
                <label
                  htmlFor="pw-confirm-input"
                  className="profil-label"
                >
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="profil-input-pw-wrap">
                  <input
                    id="pw-confirm-input"
                    type={showConfirmPw ? 'text' : 'password'}
                    className="profil-input profil-input--pw"
                    placeholder="Ketik ulang kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="profil-pw-toggle"
                    onClick={() => setShowConfirmPw((prev) => !prev)}
                    aria-label={
                      showConfirmPw
                        ? 'Sembunyikan kata sandi'
                        : 'Tampilkan kata sandi'
                    }
                  >
                    {showConfirmPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>

              <div className="profil-modal-actions">
                <button
                  type="submit"
                  className="profil-btn-save"
                  disabled={isPwSubmitting}
                >
                  {isPwSubmitting ? 'Memproses...' : 'Simpan Kata Sandi'}
                </button>
                <button
                  type="button"
                  className="profil-btn-cancel"
                  onClick={handleClosePasswordModal}
                  disabled={isPwSubmitting}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
