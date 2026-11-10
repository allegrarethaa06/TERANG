import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TRANSPARANSI_REPORTS } from '../data/transparansiData';
import { getUserInitials } from '../services/authService';
import './DashboardPage.css';
import './TransparansiPage.css';

const PAGE_SIZE = 6;

const GROUP_FILTERS = [
  { key: 'semua', label: 'Semua' },
  { key: 'aktif', label: 'Aktif' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'ditutup', label: 'Ditutup' },
];

const STATUS_TONE = {
  'Menunggu Verifikasi': 'neutral',
  Terverifikasi: 'blue',
  'Menunggu Penjadwalan': 'amber',
  Dijadwalkan: 'indigo',
  'Dalam Penanganan': 'orange',
  'Menunggu Konfirmasi Warga': 'purple',
  Selesai: 'green',
  Ditutup: 'muted',
};

const PRIORITY_TONE = { Tinggi: 'high', Sedang: 'medium', Rendah: 'low' };

function StatusBadge({ status, size = 'md' }) {
  return (
    <span className={`trp-status trp-status--${STATUS_TONE[status] || 'neutral'} trp-status--${size}`}>
      <span className="trp-status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export default function TransparansiPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [photoError, setPhotoError] = useState({});
  const dropdownRef = useRef(null);
  const detailRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('semua');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState(TRANSPARANSI_REPORTS[0]?.id || null);

  const isAuthenticated = Boolean(user);
  const displayName =
    user?.fullName || user?.name || (user?.email ? user.email.split('@')[0] : 'Warga TERANG');
  const avatarInitials = user?.initials || getUserInitials(displayName);
  const avatarUrl = user?.avatarUrl || null;

  // Ringkasan dihitung langsung dari dataset (24 / 16 / 6 / 2)
  const summary = useMemo(() => {
    const counts = { semua: TRANSPARANSI_REPORTS.length, aktif: 0, selesai: 0, ditutup: 0 };
    TRANSPARANSI_REPORTS.forEach((r) => {
      counts[r.group] += 1;
    });
    return counts;
  }, []);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TRANSPARANSI_REPORTS.filter((r) => {
      if (groupFilter !== 'semua' && r.group !== groupFilter) return false;
      if (!q) return true;
      return [r.id, r.title, r.category, r.street, r.ward, r.address, r.status]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [searchQuery, groupFilter]);

  const visibleReports = filteredReports.slice(0, visibleCount);

  // Laporan terpilih tetap valid ketika filter berubah: jatuh ke hasil pertama
  const selectedReport =
    filteredReports.find((r) => r.id === selectedId) || filteredReports[0] || null;

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

  const handleSelect = (id) => {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 960px)').matches && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGroupChange = (key) => {
    setGroupFilter(key);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setGroupFilter('semua');
    setVisibleCount(PAGE_SIZE);
  };

  const handleLogoutClick = async () => {
    setProfileMenuOpen(false);
    if (typeof onLogout === 'function') await onLogout();
    navigate('/', { replace: true });
  };

  const handleBrandClick = async (e) => {
    e.preventDefault();
    if (isAuthenticated && typeof onLogout === 'function') await onLogout();
    navigate('/', { replace: true });
  };

  const goToLaporanSaya = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setProfileMenuOpen(false);
    navigate('/laporan-saya');
  };

  const statItems = [
    { key: 'semua', value: summary.semua, label: 'Total laporan', tone: null },
    { key: 'aktif', value: summary.aktif, label: 'Aktif', tone: 'aktif' },
    { key: 'selesai', value: summary.selesai, label: 'Selesai', tone: 'selesai' },
    { key: 'ditutup', value: summary.ditutup, label: 'Ditutup', tone: 'ditutup' },
  ];

  return (
    <div className="trp-page">
      {/* Navbar — Transparansi aktif */}
      <header className="dashboard-navbar">
        <div className="dashboard-navbar-inner">
          <a
            href="/"
            className="dashboard-brand-link"
            onClick={handleBrandClick}
            aria-label="TERANG — Kembali ke Halaman Utama"
          >
            {!logoError ? (
              <img src="/logo-terang.png" alt="TERANG" className="dashboard-brand-logo"
                width="148" height="33" onError={() => setLogoError(true)} />
            ) : (
              <span className="dashboard-brand-fallback">TERANG</span>
            )}
          </a>

          <nav aria-label="Navigasi Utama TERANG">
            <ul className="dashboard-nav-center">
              <li>
                {isAuthenticated ? (
                  <Link to="/dashboard" className="dashboard-nav-item">Dashboard</Link>
                ) : (
                  <Link to="/" className="dashboard-nav-item">Beranda</Link>
                )}
              </li>
              <li>
                <Link to="/peta-laporan" className="dashboard-nav-item">Peta Laporan</Link>
              </li>
              <li>
                <Link to="/transparansi" className="dashboard-nav-item active" aria-current="page">
                  Transparansi
                </Link>
              </li>
              {isAuthenticated && (
                <li>
                  <Link to="/laporan-saya" className="dashboard-nav-item">
                    Laporan Saya
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {isAuthenticated ? (
            <div className="dashboard-profile-wrap" ref={dropdownRef}>
              <button type="button"
                className={`dashboard-profile-trigger ${profileMenuOpen ? 'open' : ''}`}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen} aria-haspopup="menu"
                aria-label={`Menu profil ${displayName}`}>
                <span className="dashboard-avatar" aria-hidden="true">
                  {avatarUrl && !avatarImgError ? (
                    <img src={avatarUrl} alt={displayName} className="dashboard-avatar-img"
                      onError={() => setAvatarImgError(true)} />
                  ) : (
                    <span>{avatarInitials}</span>
                  )}
                </span>
                <span className="dashboard-profile-name">{displayName}</span>
                <svg className={`dashboard-profile-chevron ${profileMenuOpen ? 'open' : ''}`}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div className="dashboard-profile-dropdown" role="menu" aria-label="Menu Akun Warga">
                  <div className="dashboard-dropdown-header">
                    <div className="dashboard-dropdown-name">{displayName}</div>
                    {user?.email && <div className="dashboard-dropdown-email">{user.email}</div>}
                  </div>
                  <button type="button" role="menuitem" className="dashboard-dropdown-item"
                    onClick={() => { setProfileMenuOpen(false); navigate('/dashboard'); }}>
                    <span>Dashboard Warga</span>
                  </button>
                  <button type="button" role="menuitem" className="dashboard-dropdown-item"
                    onClick={goToLaporanSaya}>
                    <span>Laporan Saya</span>
                  </button>
                  <button type="button" role="menuitem"
                    className="dashboard-dropdown-item dashboard-dropdown-logout"
                    onClick={handleLogoutClick}>
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="trp-public-auth">
              <Link to="/masuk" className="trp-auth-link">Masuk</Link>
              <Link to="/daftar" className="trp-auth-cta">Buat Laporan</Link>
            </div>
          )}
        </div>
      </header>

      <main className="trp-main">
        {/* Header halaman */}
        <div className="trp-header">
          <div>
            <h1 className="trp-title">Transparansi</h1>
            <p className="trp-subtitle">
              Pantau laporan kerusakan infrastruktur di Kecamatan Coblong, Kota Bandung beserta
              alasan prioritas dan jejak keputusannya.
            </p>
          </div>
          <span className="trp-sim-pill">Data simulasi</span>
        </div>

        {/* Ringkasan Penanganan */}
        <section className="trp-summary" aria-labelledby="trp-summary-heading">
          <h2 id="trp-summary-heading" className="trp-section-title">Ringkasan Penanganan Laporan</h2>
          <dl className="trp-stats">
            {statItems.map((item) => (
              <div key={item.key} className="trp-stat">
                <dt className="trp-stat-label">
                  {item.tone && <span className={`trp-stat-dot trp-stat-dot--${item.tone}`} aria-hidden="true" />}
                  {item.label}
                </dt>
                <dd className="trp-stat-value">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="trp-grid">
          {/* ====================== Telusuri Laporan ====================== */}
          <aside className="trp-panel trp-list-panel" aria-labelledby="trp-list-heading">
            <div className="trp-list-head">
              <h2 id="trp-list-heading" className="trp-section-title">Telusuri Laporan</h2>
              <p className="trp-muted">Pilih laporan untuk melihat proses penanganannya.</p>
            </div>

            <label className="trp-search">
              <span className="trp-sr-only">Cari laporan</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="trp-search-icon">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="search" value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari ID, judul, kategori, atau lokasi..." />
              {searchQuery && (
                <button
                  type="button"
                  className="trp-search-clear"
                  onClick={() => handleSearchChange('')}
                  aria-label="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </label>

            <div className="trp-filters" role="group" aria-label="Filter status laporan">
              {GROUP_FILTERS.map((f) => (
                <button key={f.key} type="button"
                  className={`trp-filter ${groupFilter === f.key ? 'active' : ''}`}
                  aria-pressed={groupFilter === f.key}
                  onClick={() => handleGroupChange(f.key)}>
                  {f.label}
                  <span className="trp-filter-count">{summary[f.key]}</span>
                </button>
              ))}
            </div>

            <p className="trp-result-count" aria-live="polite">
              Menampilkan {visibleReports.length} dari {filteredReports.length} laporan
            </p>

            {filteredReports.length === 0 ? (
              <div className="trp-empty">
                <p className="trp-empty-title">Tidak ada laporan yang cocok</p>
                <p className="trp-muted">Coba kata kunci lain atau ubah filter.</p>
                <button type="button" className="trp-link-btn" onClick={handleResetFilters}>
                  Hapus Filter
                </button>
              </div>
            ) : (
              <ul className="trp-list">
                {visibleReports.map((r) => {
                  const isActive = selectedReport?.id === r.id;
                  return (
                    <li key={r.id}>
                      <button type="button"
                        className={`trp-item ${isActive ? 'active' : ''}`}
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() => handleSelect(r.id)}>
                        <span className="trp-item-title">{r.title}</span>
                        <span className="trp-item-meta">
                          {r.id} · {r.location}
                        </span>
                        <span className="trp-item-foot">
                          <StatusBadge status={r.status} size="sm" />
                          <span className="trp-item-date">{r.reportedAt}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {visibleReports.length < filteredReports.length && (
              <button type="button" className="trp-more-btn"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Tampilkan {Math.min(PAGE_SIZE, filteredReports.length - visibleReports.length)} laporan lagi
              </button>
            )}
          </aside>

          {/* ====================== Detail Transparansi ====================== */}
          <article ref={detailRef} className="trp-panel trp-detail"
            aria-labelledby="trp-detail-title" aria-live="polite">
            {!selectedReport ? (
              <div className="trp-empty trp-empty--detail">
                <p className="trp-empty-title">Pilih laporan untuk melihat detail</p>
              </div>
            ) : (
              <>
                {/* Ringkasan laporan */}
                <header className="trp-detail-head">
                  <div className="trp-detail-head-main">
                    <span className="trp-detail-id">{selectedReport.id} · {selectedReport.category}</span>
                    <h2 id="trp-detail-title" className="trp-detail-title">{selectedReport.title}</h2>
                    <div className="trp-detail-badges">
                      <StatusBadge status={selectedReport.status} />
                      <span className={`trp-priority trp-priority--${PRIORITY_TONE[selectedReport.priority]}`}>
                        {selectedReport.priorityVerified ? 'Prioritas' : 'Rekomendasi'}{' '}
                        {selectedReport.priority}
                      </span>
                    </div>
                    <dl className="trp-detail-meta">
                      <div>
                        <dt className="trp-sr-only">Lokasi</dt>
                        <dd><PinIcon /> {selectedReport.address}</dd>
                      </div>
                      <div>
                        <dt className="trp-sr-only">Tanggal laporan</dt>
                        <dd>Dilaporkan {selectedReport.reportedAt}</dd>
                      </div>
                    </dl>
                  </div>

                  <figure className="trp-photo">
                    {!photoError[selectedReport.id] ? (
                      <img key={selectedReport.id} src={selectedReport.photoUrl}
                        alt={`Foto ilustrasi untuk laporan ${selectedReport.title}`}
                        loading="lazy"
                        onError={() => setPhotoError((p) => ({ ...p, [selectedReport.id]: true }))} />
                    ) : (
                      <div className="trp-photo-fallback">Foto tidak tersedia</div>
                    )}
                    <figcaption>
                      {selectedReport.photoSource === 'warga'
                        ? `Foto laporan warga · ${selectedReport.reportedAt}`
                        : 'Foto ilustrasi · Data simulasi'}
                    </figcaption>
                  </figure>
                </header>

                {/* Alasan Prioritas Awal - SECTION CARD TERPISAH DENGAN BACKGROUND #FFFEE8 */}
                <section className="trp-priority-card" aria-labelledby="trp-reason-heading">
                  <div className="trp-section-head">
                    <h3 id="trp-reason-heading" className="trp-section-title">Alasan Prioritas Awal</h3>
                    <span className="trp-priority-verified-tag">
                      {selectedReport.priorityVerified
                        ? `Diverifikasi admin · ${selectedReport.priorityVerifiedAt}`
                        : selectedReport.status === 'Ditutup'
                          ? 'Tidak dilanjutkan'
                          : 'Belum diverifikasi admin'}
                    </span>
                  </div>
                  <p className="trp-priority-note">
                    Rekomendasi awal sistem berdasarkan isi laporan, bukan keputusan akhir. Keputusan admin yang telah diverifikasi tercatat di Jejak Keputusan di bawah.
                  </p>
                  <p className="trp-reason-summary">{selectedReport.reasonSummary}</p>
                  <ol className="trp-reasons">
                    {selectedReport.reasons.map((reason, idx) => (
                      <li key={reason.title} className="trp-reason">
                        <span className="trp-reason-num" aria-hidden="true">{idx + 1}</span>
                        <div className="trp-reason-content">
                          <p className="trp-reason-title">{reason.title}</p>
                          <p className="trp-reason-desc">{reason.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* Jejak Keputusan */}
                <section className="trp-section trp-decision-trail" aria-labelledby="trp-trail-heading">
                  <h3 id="trp-trail-heading" className="trp-section-title">Jejak Keputusan</h3>
                  <ol className="trp-timeline">
                    {selectedReport.timeline.map((step) => (
                      <li key={step.key}
                        className={`trp-step ${step.isCurrent ? 'current' : ''}`}
                        aria-current={step.isCurrent ? 'step' : undefined}>
                        <span className="trp-step-date">{step.date}</span>
                        <span className="trp-step-marker" aria-hidden="true" />
                        <div className="trp-step-body">
                          <p className="trp-step-title">
                            {step.title}
                            {step.isCurrent && <span className="trp-step-tag">Tahap terkini</span>}
                          </p>
                          <p className="trp-step-note">{step.note}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* Jejak Anggaran */}
                <section className="trp-section trp-budget" aria-labelledby="trp-budget-heading">
                  <div className="trp-section-head">
                    <h3 id="trp-budget-heading" className="trp-section-title">Jejak Anggaran</h3>
                    <span className="trp-budget-status">Belum terverifikasi</span>
                  </div>
                  <div className="trp-budget-box">
                    <p className="trp-budget-main-text">
                      Belum ada informasi anggaran terverifikasi.
                    </p>
                  </div>
                  <p className="trp-budget-note">
                    Data anggaran akan tampil setelah diverifikasi oleh dinas terkait. Tidak ada angka yang ditampilkan sebelum verifikasi resmi.
                  </p>
                </section>

                <div className="trp-detail-actions">
                  <button
                    type="button"
                    className="trp-primary-btn"
                    onClick={() =>
                      navigate(`/laporan/${encodeURIComponent(selectedReport.id)}`, {
                        state: { from: '/transparansi', fromLabel: 'Transparansi' },
                      })
                    }
                  >
                    Buka Laporan Lengkap
                  </button>
                </div>
              </>
            )}
          </article>
        </div>
      </main>
    </div>
  );
}
