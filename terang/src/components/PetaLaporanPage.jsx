import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { SAMPLE_REPORTS } from '../data/reportsData';
import { COBLONG_CENTER } from '../services/geoapifyService';
import { getUserInitials } from '../services/authService';
import './DashboardPage.css';
import './PetaLaporanPage.css';

const CATEGORY_OPTIONS = [
  'Semua Kategori',
  'Jalan Rusak',
  'Drainase',
  'Lampu Jalan',
  'Fasilitas Umum',
  'Lainnya',
];

const STATUS_OPTIONS = [
  'Semua Status',
  'Menunggu Verifikasi',
  'Terverifikasi',
  'Dalam Penanganan',
  'Menunggu Konfirmasi',
  'Selesai',
];

const PRIORITY_OPTIONS = [
  { value: 'Semua Prioritas', label: 'Semua Prioritas' },
  { value: 'Most Urgent', label: 'Prioritas Sangat Tinggi (Most Urgent)' },
  { value: 'Urgent', label: 'Prioritas Tinggi (Urgent)' },
  { value: 'Not Urgent', label: 'Prioritas Normal (Not Urgent)' },
];

function normalizeCategoryLabel(rawCategory) {
  const val = String(rawCategory || '').trim();
  if (!val) return 'Lainnya';
  if (
    val.toLowerCase() === 'penerangan jalan' ||
    val.toLowerCase() === 'lampu jalan'
  ) {
    return 'Lampu Jalan';
  }
  return val;
}

function parseReportCoordinates(report, indexInDuplicateGroup = 0) {
  let lat = Number(report?.latitude);
  let lng = Number(report?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const raw = String(report?.coordinates || '');
    const parts = raw.split(',').map((s) => parseFloat(s.trim()));
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      lat = parts[0];
      lng = parts[1];
    }
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    lat = COBLONG_CENTER.lat;
    lng = COBLONG_CENTER.lng;
  }

  // Jika ada 2 laporan pada koordinat string yang persis sama (misal di koridor Jl. Dipatiukur),
  // beri pergeseran kecil вдоль koridor jalan (~120m) agar kedua marker tidak saling menumpuk 100%
  if (indexInDuplicateGroup > 0) {
    lat -= indexInDuplicateGroup * 0.0011;
    lng += indexInDuplicateGroup * 0.00025;
  }

  return { lat, lng };
}

function getStatusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('selesai')) return 'status-done';
  if (s.includes('penanganan')) return 'status-progress';
  if (s.includes('konfirmasi')) return 'status-confirm';
  if (s.includes('terverifikasi') && !s.includes('menunggu')) {
    return 'status-verified';
  }
  return 'status-pending';
}

function createReportMarkerIcon({ isRecurring, isSelected }) {
  const selectedClass = isSelected ? 'is-selected' : '';

  if (isRecurring) {
    return L.divIcon({
      className: 'peta-custom-marker-wrap',
      html: `
        <div class="peta-marker-pin recurring ${selectedClass}" title="Diduga rusak lagi">
          <svg width="38" height="46" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M19 1.75C9.47309 1.75 1.75 9.47309 1.75 19C1.75 30.8 19 44.2 19 44.2C19 44.2 36.25 30.8 36.25 19C36.25 9.47309 28.5269 1.75 19 1.75Z" fill="#FFFF6B" stroke="#271A62" stroke-width="2.5"/>
            <circle cx="19" cy="18.5" r="10.5" fill="#FFFF6B" stroke="#271A62" stroke-width="1.5"/>
            <path d="M19 12.5V19.5" stroke="#271A62" stroke-width="2.8" stroke-linecap="round"/>
            <circle cx="19" cy="23.5" r="1.6" fill="#271A62"/>
          </svg>
        </div>
      `,
      iconSize: [38, 46],
      iconAnchor: [19, 44],
      popupAnchor: [0, -40],
    });
  }

  return L.divIcon({
    className: 'peta-custom-marker-wrap',
    html: `
      <div class="peta-marker-pin normal ${selectedClass}" title="Lokasi laporan">
        <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M18 1.5C8.8873 1.5 1.5 8.8873 1.5 18C1.5 29.25 18 42.2 18 42.2C18 42.2 34.5 29.25 34.5 18C34.5 8.8873 27.1127 1.5 18 1.5Z" fill="#271A62" stroke="#FFFFFF" stroke-width="2.5"/>
          <circle cx="18" cy="17.5" r="6.5" fill="#FFFFFF"/>
        </svg>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -38],
  });
}

function MapViewportController({ focusTarget, mobileViewTab }) {
  const map = useMap();
  const prevKeyRef = useRef('');

  useEffect(() => {
    // Pastikan ukuran tile Leaflet dihitung ulang saat berpindah tab di mobile
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 120);
    return () => clearTimeout(timer);
  }, [map, mobileViewTab]);

  useEffect(() => {
    if (
      focusTarget &&
      Number.isFinite(focusTarget.lat) &&
      Number.isFinite(focusTarget.lng)
    ) {
      const key = `${focusTarget.lat.toFixed(6)},${focusTarget.lng.toFixed(6)},${focusTarget.seq || 0}`;
      if (prevKeyRef.current !== key) {
        prevKeyRef.current = key;
        map.flyTo([focusTarget.lat, focusTarget.lng], focusTarget.zoom || 16, {
          duration: 0.65,
        });
      }
    }
  }, [map, focusTarget]);

  return null;
}

export default function PetaLaporanPage({ user, onLogout }) {
  const navigate = useNavigate();

  // Navbar state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const dropdownRef = useRef(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [selectedPriority, setSelectedPriority] = useState('Semua Prioritas');
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);

  // Selected report & map interaction state (Popup tidak terbuka otomatis saat halaman pertama dimuat)
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [mapFocusTarget, setMapFocusTarget] = useState(null);
  const [mobileTab, setMobileTab] = useState('daftar'); // 'daftar' | 'peta'
  const [tileErrorCount, setTileErrorCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  const markerRefs = useRef({});
  const cardRefs = useRef({});

  const isAuthenticated = Boolean(user);
  const displayName =
    user?.fullName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Warga TERANG');
  const avatarInitials = user?.initials || getUserInitials(displayName);
  const avatarUrl = user?.avatarUrl || null;

  // Gabungkan laporan pengguna (sesi demo) dan SAMPLE_REPORTS tanpa duplikasi
  const allReports = useMemo(() => {
    const userReports = Array.isArray(user?.reports) ? user.reports : [];
    const seenIds = new Set();
    const merged = [];

    for (const item of [...userReports, ...SAMPLE_REPORTS]) {
      if (!item || !item.id || seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      merged.push(item);
    }

    const coordCounts = {};
    return merged.map((rep) => {
      const coordKey =
        Number.isFinite(rep.latitude) && Number.isFinite(rep.longitude)
          ? `${Number(rep.latitude).toFixed(4)},${Number(rep.longitude).toFixed(4)}`
          : String(rep.coordinates || '').trim();
      const dupIndex = coordCounts[coordKey] || 0;
      coordCounts[coordKey] = dupIndex + 1;

      const { lat, lng } = parseReportCoordinates(rep, dupIndex);
      const displayCategory = normalizeCategoryLabel(rep.category);
      const isRecurring = Boolean(rep.radarDetails?.isRecurring);
      const thumbUrl =
        rep.photoUrl ||
        rep.photoPreviews?.[0]?.previewUrl ||
        '/images/figma-radar-thumb.jpg';
      const displayTime =
        rep.observedDate || rep.createdAt || rep.reportedAt || 'Baru saja';
      const displayPriority = rep.urgency || 'Urgent';

      return {
        ...rep,
        lat,
        lng,
        displayCategory,
        isRecurring,
        thumbUrl,
        displayTime,
        displayPriority,
      };
    });
  }, [user]);

  // Filter laporan secara langsung berdasarkan pencarian, kategori, status, dan prioritas
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allReports.filter((rep) => {
      if (q) {
        const haystack = [
          rep.id,
          rep.title,
          rep.displayCategory,
          rep.category,
          rep.address,
          rep.location,
          rep.ward,
          rep.subdistrict,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }

      if (
        selectedCategory !== 'Semua Kategori' &&
        rep.displayCategory.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      if (
        selectedStatus !== 'Semua Status' &&
        String(rep.status || '').toLowerCase() !== selectedStatus.toLowerCase()
      ) {
        return false;
      }

      if (
        selectedPriority !== 'Semua Prioritas' &&
        String(rep.displayPriority || '').toLowerCase() !==
          selectedPriority.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [
    allReports,
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedPriority,
  ]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== 'Semua Kategori' ||
    selectedStatus !== 'Semua Status' ||
    selectedPriority !== 'Semua Prioritas';

  // Close profile dropdown on outside click or Escape
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

  // Buka popup marker secara terprogram ketika kartu laporan diklik
  useEffect(() => {
    if (!selectedReportId) return undefined;
    const timer = setTimeout(() => {
      const markerInstance = markerRefs.current[selectedReportId];
      if (markerInstance && typeof markerInstance.openPopup === 'function') {
        markerInstance.openPopup();
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [selectedReportId, mobileTab]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Semua Kategori');
    setSelectedStatus('Semua Status');
    setSelectedPriority('Semua Prioritas');
    setSelectedReportId(null);
    setMapFocusTarget((prev) => ({
      lat: COBLONG_CENTER.lat,
      lng: COBLONG_CENTER.lng,
      zoom: 15,
      seq: (prev?.seq || 0) + 1,
    }));
  };

  const handleSelectReportCard = (report, switchToMapOnMobile = false) => {
    setSelectedReportId(report.id);
    setMapFocusTarget((prev) => ({
      lat: report.lat,
      lng: report.lng,
      zoom: 16,
      seq: (prev?.seq || 0) + 1,
    }));
    if (switchToMapOnMobile) {
      setMobileTab('peta');
    }
  };

  const handleSelectMarker = (report) => {
    setSelectedReportId(report.id);
    const cardEl = cardRefs.current[report.id];
    if (cardEl && typeof cardEl.scrollIntoView === 'function') {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleRecenterCoblong = () => {
    setMapFocusTarget((prev) => ({
      lat: COBLONG_CENTER.lat,
      lng: COBLONG_CENTER.lng,
      zoom: 15,
      seq: (prev?.seq || 0) + 1,
    }));
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
    if (isAuthenticated && typeof onLogout === 'function') {
      await onLogout();
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="peta-laporan-page">
      {/* Top Navbar: Menggunakan "Dashboard" saat sudah login, dan highlight kuning pada "Peta Laporan" */}
      <header className="dashboard-navbar peta-navbar">
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

          <nav aria-label="Navigasi Utama TERANG">
            <ul className="dashboard-nav-center">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to="/dashboard" className="dashboard-nav-item">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/peta-laporan"
                      className="dashboard-nav-item active"
                      aria-current="page"
                    >
                      Peta Laporan
                    </Link>
                  </li>
                  <li>
                    <Link to="/transparansi" className="dashboard-nav-item">
                      Transparansi
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/laporan-saya"
                      className="dashboard-nav-item"
                    >
                      Laporan Saya
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/" className="dashboard-nav-item">
                      Beranda
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/peta-laporan"
                      className="dashboard-nav-item active"
                      aria-current="page"
                    >
                      Peta Laporan
                    </Link>
                  </li>
                  <li>
                    <Link to="/transparansi" className="dashboard-nav-item">
                      Transparansi
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {isAuthenticated ? (
            <div className="dashboard-profile-wrap" ref={dropdownRef}>
              <button
                type="button"
                className={`dashboard-profile-trigger ${
                  profileMenuOpen ? 'open' : ''
                }`}
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
                  className={`dashboard-profile-chevron ${
                    profileMenuOpen ? 'open' : ''
                  }`}
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
                      <div className="dashboard-dropdown-email">
                        {user.email}
                      </div>
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
                    className="dashboard-dropdown-item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/buat-laporan');
                    }}
                  >
                    <span>Buat Laporan Baru</span>
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
            <div className="peta-public-auth-actions">
              <Link to="/masuk" className="peta-auth-link">
                Masuk
              </Link>
              <Link to="/daftar" className="peta-auth-cta">
                Buat Laporan
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile View Switcher ("Daftar" vs "Peta") pada layar <= 900px */}
      <div
        className="peta-mobile-tabs"
        role="tablist"
        aria-label="Pilih tampilan Daftar atau Peta"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'daftar'}
          className={`peta-mobile-tab-btn ${
            mobileTab === 'daftar' ? 'active' : ''
          }`}
          onClick={() => setMobileTab('daftar')}
        >
          <span>Daftar ({filteredReports.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'peta'}
          className={`peta-mobile-tab-btn ${
            mobileTab === 'peta' ? 'active' : ''
          }`}
          onClick={() => setMobileTab('peta')}
        >
          <span>Peta</span>
        </button>
      </div>

      {/* Main Two-Column Layout (34% Sidebar Kiri, 66% Peta Kanan) */}
      <main className="peta-workspace">
        {/* SIDEBAR KIRI: Pencarian, Filter, & Daftar Laporan */}
        <aside
          className={`peta-sidebar ${
            mobileTab === 'peta' ? 'mobile-hidden' : ''
          }`}
          aria-label="Filter dan Daftar Laporan Warga"
        >
          <div className="peta-sidebar-top">
            <div className="peta-sidebar-title-row">
              <div>
                <h1 className="peta-page-title">Peta Laporan Warga</h1>
                <p className="peta-page-subtitle">
                  Pantau sebaran titik kerusakan, status tindak lanjut, dan indikasi kerusakan berulang.
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="peta-search-box">
              <span className="peta-search-icon" aria-hidden="true">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                className="peta-search-input"
                placeholder="Cari ID, judul, kategori, atau lokasi jalan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari laporan berdasarkan ID, judul, kategori, atau lokasi"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="peta-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus kata kunci pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <div className="peta-mobile-filter-bar">
              <button
                type="button"
                className={`peta-mobile-filter-toggle ${mobileFiltersExpanded ? 'expanded' : ''}`}
                onClick={() => setMobileFiltersExpanded((prev) => !prev)}
                aria-expanded={mobileFiltersExpanded}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>{mobileFiltersExpanded ? 'Sembunyikan Filter' : 'Filter Kategori & Status'}</span>
                <span className="peta-mobile-filter-badge">
                  {selectedCategory !== 'Semua Kategori' || selectedStatus !== 'Semua Status' || selectedPriority !== 'Semua Prioritas' ? 'Aktif' : ''}
                </span>
              </button>
            </div>

            {/* Filter Kategori & Status (Selalu tampil di desktop, collapsible di mobile) */}
            <div className={`peta-filters-collapsible ${mobileFiltersExpanded ? 'expanded' : ''}`}>
              {/* Filter Kategori Pills */}
              <div
                className="peta-category-pills"
                role="group"
                aria-label="Filter Kategori Kerusakan"
              >
                {CATEGORY_OPTIONS.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`peta-cat-pill ${isActive ? 'active' : ''}`}
                      aria-pressed={isActive}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Filter Status & Prioritas */}
              <div className="peta-select-filters">
                <div className="peta-select-group">
                  <label htmlFor="filter-status-select" className="peta-filter-label">
                    Status
                  </label>
                  <select
                    id="filter-status-select"
                    className="peta-filter-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="peta-select-group">
                  <label
                    htmlFor="filter-priority-select"
                    className="peta-filter-label"
                  >
                    Prioritas
                  </label>
                  <select
                    id="filter-priority-select"
                    className="peta-filter-select"
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                  >
                    {PRIORITY_OPTIONS.map((pr) => (
                      <option key={pr.value} value={pr.value}>
                        {pr.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Jumlah Hasil & Aksi Hapus Filter */}
            <div className="peta-results-bar" aria-live="polite">
              <span className="peta-results-count">
                Menampilkan <strong>{filteredReports.length}</strong> dari{' '}
                {allReports.length} laporan
              </span>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="peta-reset-filter-btn"
                  onClick={handleResetFilters}
                >
                  Hapus Filter
                </button>
              )}
            </div>
          </div>

          {/* Daftar Kartu Laporan (Scrollable Mandiri) */}
          <div className="peta-report-list-container">
            {filteredReports.length === 0 ? (
              <div className="peta-empty-state" role="status">
                <h2 className="peta-empty-title">
                  Tidak ada laporan yang cocok
                </h2>
                <p className="peta-empty-desc">
                  Coba gunakan kata kunci lain atau sesuaikan pilihan kategori, status, dan prioritas.
                </p>
                <button
                  type="button"
                  className="peta-empty-reset-btn"
                  onClick={handleResetFilters}
                >
                  Hapus Filter
                </button>
              </div>
            ) : (
              <ul className="peta-report-list" aria-label="Daftar Laporan">
                {filteredReports.map((rep) => {
                  const isSelected = selectedReportId === rep.id;
                  return (
                    <li
                      key={rep.id}
                      ref={(el) => {
                        if (el) {
                          cardRefs.current[rep.id] = el;
                        }
                      }}
                    >
                      <article
                        className={`peta-report-card ${
                          isSelected ? 'selected' : ''
                        }`}
                        onClick={() => handleSelectReportCard(rep, false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectReportCard(rep, false);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        aria-label={`${rep.title}, status ${rep.status}, lokasi ${rep.address}`}
                      >
                        <div className="peta-card-body">
                          <img
                            src={rep.thumbUrl}
                            alt={rep.title}
                            className="peta-card-thumb"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src =
                                '/images/figma-radar-thumb.jpg';
                            }}
                          />

                          <div className="peta-card-main">
                            {/* 1. Judul Laporan (SemiBold #303040) */}
                            <h2 className="peta-card-title">{rep.title}</h2>

                            {/* 2. Status Penanganan & Kategori */}
                            <div className="peta-card-badges-row">
                              <span
                                className={`peta-status-badge ${getStatusBadgeClass(
                                  rep.status
                                )}`}
                              >
                                {rep.status || 'Menunggu Verifikasi'}
                              </span>

                              <span className="peta-category-label">
                                {rep.displayCategory}
                              </span>

                              {rep.isRecurring && (
                                <span className="peta-recurring-badge">
                                  <span aria-hidden="true">!</span> Diduga Rusak Lagi
                                </span>
                              )}
                            </div>

                            {/* 3. Lokasi (Maks 2 Baris) */}
                            <p className="peta-card-location" title={rep.address || rep.location}>
                              {rep.address || rep.location}
                            </p>

                            {/* 4. ID / Tanggal & Aksi Jelas ("Titik Peta" & "Lihat Detail") */}
                            <div className="peta-card-footer">
                              <span className="peta-card-meta">
                                {rep.id} • {rep.displayTime}
                              </span>

                              <div className="peta-card-actions">
                                <button
                                  type="button"
                                  className="peta-card-map-action"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectReportCard(rep, true);
                                  }}
                                  aria-label={`Fokuskan titik peta untuk ${rep.title}`}
                                >
                                  Titik Peta
                                </button>
                                <Link
                                  to={`/laporan/${encodeURIComponent(rep.id)}`}
                                  state={{ from: '/peta-laporan', fromLabel: 'Peta Laporan' }}
                                  className="peta-card-detail-action"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label={`Lihat detail lengkap laporan ${rep.id}`}
                                >
                                  Lihat Detail →
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* AREA KANAN (66%): Peta Interaktif React Leaflet + OpenStreetMap */}
        <section
          className={`peta-map-section ${
            mobileTab === 'daftar' ? 'mobile-hidden' : ''
          }`}
          aria-label="Peta Sebaran Laporan Kecamatan Coblong"
        >
          {/* Floating Info Wilayah & Data Simulasi di Pojok Kiri Atas Peta */}
          <div className="peta-map-top-bar">
            <div className="peta-region-pill">
              <span className="peta-region-dot" aria-hidden="true" />
              <span className="peta-region-text">
                Wilayah Peta: Coblong, Bandung
              </span>
            </div>

            <button
              type="button"
              className="peta-recenter-map-btn"
              onClick={handleRecenterCoblong}
            >
              Reset Tampilan Peta
            </button>

            <span className="peta-simulasi-disclaimer">
              Data simulasi — bukan data resmi pemerintah
            </span>
          </div>

          {!mapReady && (
            <div className="peta-map-loading" role="status">
              <span>Memuat peta Kecamatan Coblong...</span>
            </div>
          )}

          {tileErrorCount >= 4 && (
            <div className="peta-map-error-banner" role="alert">
              <span>
                Sebagian ubin peta gagal dimuat karena koneksi jaringan. Daftar laporan di panel kiri tetap dapat diakses.
              </span>
            </div>
          )}

          <MapContainer
            center={[COBLONG_CENTER.lat, COBLONG_CENTER.lng]}
            zoom={15}
            scrollWheelZoom={true}
            className="peta-leaflet-canvas"
            whenReady={() => setMapReady(true)}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Peta Jalan (OpenStreetMap)">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  eventHandlers={{
                    tileerror: () =>
                      setTileErrorCount((prev) => Math.min(prev + 1, 10)),
                    tileload: () => setTileErrorCount(0),
                  }}
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Peta Terang (Carto Voyager)">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; CARTO'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <MapViewportController
              focusTarget={mapFocusTarget}
              mobileViewTab={mobileTab}
            />

            {filteredReports.map((rep) => {
              const isSelected = selectedReportId === rep.id;
              const markerIcon = createReportMarkerIcon({
                isRecurring: rep.isRecurring,
                isSelected,
              });

              return (
                <Marker
                  key={rep.id}
                  position={[rep.lat, rep.lng]}
                  icon={markerIcon}
                  ref={(ref) => {
                    if (ref) {
                      markerRefs.current[rep.id] = ref;
                    }
                  }}
                  eventHandlers={{
                    click: () => handleSelectMarker(rep),
                  }}
                >
                  <Popup
                    className="peta-leaflet-popup"
                    maxWidth={300}
                    minWidth={265}
                  >
                    <div className="peta-popup-card">
                      <div className="peta-popup-thumb-wrap">
                        <img
                          src={rep.thumbUrl}
                          alt={rep.title}
                          className="peta-popup-thumb"
                          onError={(e) => {
                            e.currentTarget.src =
                              '/images/figma-radar-thumb.jpg';
                          }}
                        />
                        <span
                          className={`peta-status-badge popup-status ${getStatusBadgeClass(
                            rep.status
                          )}`}
                        >
                          {rep.status || 'Menunggu Verifikasi'}
                        </span>
                        {rep.isDemoData && (
                          <span className="peta-popup-sim-caption">
                            Foto ilustrasi · Data simulasi
                          </span>
                        )}
                      </div>

                      <div className="peta-popup-body">
                        <div className="peta-popup-meta-top">
                          <span className="peta-popup-id">{rep.id}</span>
                          <span className="peta-popup-dot">•</span>
                          <span className="peta-popup-category">
                            {rep.displayCategory}
                          </span>
                        </div>

                        {rep.isRecurring && (
                          <div className="peta-popup-recurring">
                            ! Diduga Rusak Lagi
                          </div>
                        )}

                        <h3 className="peta-popup-title">{rep.title}</h3>

                        <p className="peta-popup-address">
                          {rep.address || rep.location}
                        </p>

                        <button
                          type="button"
                          className="peta-popup-detail-btn"
                          onClick={() =>
                            navigate(`/laporan/${encodeURIComponent(rep.id)}`, {
                              state: { from: '/peta-laporan', fromLabel: 'Peta Laporan' },
                            })
                          }
                        >
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Legend Kecil di Pojok Kanan Bawah Peta */}
          <div className="peta-map-legend" aria-label="Keterangan Simbol Peta">
            <div className="peta-legend-item">
              <span
                className="peta-legend-swatch normal"
                aria-hidden="true"
              />
              <span className="peta-legend-label">Lokasi laporan</span>
            </div>
            <div className="peta-legend-item">
              <span
                className="peta-legend-swatch recurring"
                aria-hidden="true"
              >
                !
              </span>
              <span className="peta-legend-label">Diduga rusak lagi</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
