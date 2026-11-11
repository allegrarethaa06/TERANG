import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { deduplicateReports, normalizeReportId } from '../services/demoAuthService';
import AppNavbar from './AppNavbar';
import './DashboardPage.css';
import './LaporanSayaPage.css';

const STATUS_FILTERS = [
  'Semua Status',
  'Menunggu Verifikasi',
  'Terverifikasi',
  'Dalam Penanganan',
  'Selesai',
  'Ditutup',
];

const STATUS_STYLE_MAP = {
  'Menunggu Verifikasi': {
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
  },
  'Terverifikasi': {
    bg: '#E0F2FE',
    text: '#0369A1',
    border: '#BAE6FD',
  },
  'Dalam Penanganan': {
    bg: '#EDE9FE',
    text: '#5B21B6',
    border: '#DDD6FE',
  },
  'Selesai': {
    bg: '#D1FADF',
    text: '#027A48',
    border: '#A7F3D0',
  },
  'Ditutup': {
    bg: '#F3F4F6',
    text: '#4B5563',
    border: '#E5E7EB',
  },
};

function StatusClockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function SearchMagnifierIcon({ size = 18 }) {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function LaporanSayaPage({ user, onLogout }) {
  const navigate = useNavigate();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');

  // Laporan asli milik akun pengguna yang sedang login (dibersihkan dari duplikasi ID)
  const userReports = useMemo(() => {
    const raw = Array.isArray(user?.reports) ? user.reports : [];
    return deduplicateReports(raw);
  }, [user]);

  // Filtered reports calculation — search and status filter bekerja bersamaan
  // Pencarian dibatasi berdasarkan ID, judul, atau kategori laporan sesuai spesifikasi
  const filteredReports = useMemo(() => {
    return userReports.filter((item) => {
      if (!item) return false;

      // 1. Filter status
      if (selectedStatus !== 'Semua Status') {
        const itemStatus = String(item.status || '').trim().toLowerCase();
        const targetStatus = selectedStatus.trim().toLowerCase();
        if (itemStatus !== targetStatus) {
          return false;
        }
      }

      // 2. Filter pencarian: berdasarkan ID, judul, atau kategori laporan
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const rawId = String(item.id || '').toLowerCase();
        const cleanId = normalizeReportId(rawId).toLowerCase();
        const idMatches = rawId.includes(q) || cleanId.includes(q);

        const titleMatches = String(item.title || '')
          .toLowerCase()
          .includes(q);

        const categoryMatches =
          String(item.category || '').toLowerCase().includes(q) ||
          String(item.customCategory || '').toLowerCase().includes(q);

        if (!idMatches && !titleMatches && !categoryMatches) {
          return false;
        }
      }

      return true;
    });
  }, [userReports, selectedStatus, searchQuery]);

  // Format display ID (ensure starts with #)
  const formatReportId = (id) => {
    if (!id) return '#TRG-000000';
    const clean = normalizeReportId(id);
    return `#${clean}`;
  };

  // Format display location
  const formatLocation = (item) => {
    if (item.subdistrict) {
      const sub = String(item.subdistrict).trim();
      return sub.startsWith('Kec.') ? sub : `Kec. ${sub}, Bandung`;
    }
    if (item.location) {
      return item.location;
    }
    if (item.address) {
      return item.address;
    }
    return 'Kec. Coblong, Bandung';
  };

  // Format display category
  const formatCategory = (item) => {
    if (item.category === 'Lainnya' && item.customCategory) {
      return item.customCategory;
    }
    return item.category || 'Jalan Rusak';
  };

  // Format display date (supports ISO format, ID format, and expands abbreviations)
  const formatDate = (dateStr) => {
    if (!dateStr) return '8 November 2026';
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        }
      } catch {
        // Fallback below
      }
    }
    return String(dateStr)
      .replace(/\bJan\b/i, 'Januari')
      .replace(/\bFeb\b/i, 'Februari')
      .replace(/\bMar\b/i, 'Maret')
      .replace(/\bApr\b/i, 'April')
      .replace(/\bMei\b/i, 'Mei')
      .replace(/\bJun\b/i, 'Juni')
      .replace(/\bJul\b/i, 'Juli')
      .replace(/\bAgu\b/i, 'Agustus')
      .replace(/\bSep\b/i, 'September')
      .replace(/\bOkt\b/i, 'Oktober')
      .replace(/\bNov\b/i, 'November')
      .replace(/\bDes\b/i, 'Desember');
  };

  // Reset filter & search
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('Semua Status');
  };

  return (
    <div className="laporan-saya-page">
      {/* Top Navbar Responsif TERANG dengan Mobile Hamburger */}
      <AppNavbar user={user} onLogout={onLogout} currentPage="laporan-saya" />

      {/* Main Content Area */}
      <main className="lps-main">
        <div className="lps-container">
          {/* Page Heading */}
          <header className="lps-header">
            <h1 className="lps-title">Laporan Saya</h1>
            <p className="lps-subtitle">
              Pantau semua laporan yang sudah kamu kirim.
            </p>
          </header>

          {/* KONDISI 1: Belum Ada Laporan sama sekali pada akun pengguna ini */}
          {userReports.length === 0 ? (
            <div className="lps-empty-card">
              <img
                src="/images/caya-flat.png"
                alt="Belum ada laporan"
                className="lps-empty-caya"
                width="136"
                height="146"
              />
              <h2 className="lps-empty-title">Belum ada laporan</h2>
              <p className="lps-empty-desc">
                Kamu belum mengirim laporan apa pun. Mulai laporkan kerusakan di
                sekitarmu dan pantau perkembangannya di sini.
              </p>
              <button
                type="button"
                className="lps-btn-primary"
                onClick={() => navigate('/buat-laporan')}
              >
                <PlusIcon />
                <span>Buat Laporan</span>
              </button>
            </div>
          ) : (
            /* KONDISI 2 & 3: Akun sudah pernah membuat laporan */
            <>
              {/* Search Bar Full Width (Tanpa tombol Buat Laporan di sampingnya) */}
              <div className="lps-search-bar-wrap">
                <div className="lps-search-box">
                  <span className="lps-search-icon" aria-hidden="true">
                    <SearchMagnifierIcon size={18} />
                  </span>
                  <input
                    type="text"
                    className="lps-search-input"
                    placeholder="Cari judul atau ID laporan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Cari judul atau ID laporan"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="lps-search-clear"
                      onClick={() => setSearchQuery('')}
                      aria-label="Hapus kata kunci pencarian"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Chips & Result Counter */}
              <div className="lps-filter-row">
                <div
                  className="lps-filter-chips"
                  role="tablist"
                  aria-label="Filter status laporan"
                >
                  {STATUS_FILTERS.map((status) => {
                    const isActive = selectedStatus === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`lps-filter-chip ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedStatus(status)}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>

                <div className="lps-counter">
                  Menampilkan {filteredReports.length} laporan
                </div>
              </div>

              {/* KONDISI 2: Daftar Laporan Ditemukan (Langsung tersusun vertikal full width tanpa wadah luar) */}
              {filteredReports.length > 0 ? (
                <div className="lps-report-list">
                  {filteredReports.map((item, idx) => {
                    const normId = normalizeReportId(item.id) || `TRG-${idx + 1}`;
                    const formattedId = formatReportId(normId);
                    const statusName = item.status || 'Menunggu Verifikasi';
                    const statusTone =
                      STATUS_STYLE_MAP[statusName] || STATUS_STYLE_MAP['Menunggu Verifikasi'];
                    const thumbUrl =
                      item.photoUrl ||
                      item.photoPreviews?.[0]?.previewUrl ||
                      (item.isDemoData ? '/images/ubud-jalan-raya-pothole-2009.jpg' : '');
                    const displayTitle =
                      item.title ||
                      item.customCategory ||
                      item.category ||
                      'Jalan Rusak & Berlubang';
                    const displayLocation = formatLocation(item);
                    const displayCategory = formatCategory(item);
                    const displayDate = formatDate(item.createdAt);

                    return (
                      <article key={normId} className="lps-report-card">
                        <div className="lps-card-left">
                          <div className="lps-thumb-wrap" style={{ position: 'relative' }}>
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={`Foto kerusakan ${formattedId}`}
                                className="lps-thumb-img"
                                onError={(e) => {
                                  if (item.isDemoData) {
                                    e.currentTarget.src =
                                      '/images/ubud-jalan-raya-pothole-2009.jpg';
                                  } else {
                                    e.currentTarget.style.display = 'none';
                                  }
                                }}
                              />
                            ) : (
                              <div
                                className="lps-thumb-placeholder"
                                aria-label="Tidak ada foto terlampir"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#F2F4F7',
                                  color: '#98A2B3',
                                }}
                              >
                                <CategoryIcon />
                              </div>
                            )}
                            {item.isDemoData && (
                              <span
                                className="lps-thumb-simulasi-badge"
                                title="Foto ilustrasi · Data simulasi"
                                style={{
                                  position: 'absolute',
                                  bottom: '4px',
                                  left: '4px',
                                  fontSize: '9.5px',
                                  fontWeight: 600,
                                  backgroundColor: 'rgba(39, 26, 98, 0.78)',
                                  color: '#FFFFFF',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  pointerEvents: 'none',
                                  lineHeight: 1.2,
                                }}
                              >
                                Simulasi
                              </span>
                            )}
                          </div>

                          <div className="lps-info-wrap">
                            {/* Row 1: ID & Status Badge */}
                            <div className="lps-meta-top">
                              <span className="lps-report-id">{formattedId}</span>
                              <span
                                className="lps-status-badge"
                                style={{
                                  backgroundColor: statusTone.bg,
                                  color: statusTone.text,
                                }}
                              >
                                <StatusClockIcon />
                                <span>{statusName}</span>
                              </span>
                            </div>

                            {/* Row 2: Judul Laporan (SemiBold) */}
                            <h2 className="lps-card-title">{displayTitle}</h2>

                            {/* Row 3: Metadata Lokasi | Kategori | Tanggal (Regular Abu-abu) */}
                            <div className="lps-meta-bottom">
                              <span className="lps-meta-item">
                                <PinIcon />
                                <span>{displayLocation}</span>
                              </span>
                              <span className="lps-meta-divider" aria-hidden="true">
                                |
                              </span>
                              <span className="lps-meta-item">
                                <CategoryIcon />
                                <span>{displayCategory}</span>
                              </span>
                              <span className="lps-meta-divider" aria-hidden="true">
                                |
                              </span>
                              <span className="lps-meta-item">
                                <CalendarIcon />
                                <span>{displayDate}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Button Lihat Detail */}
                        <div className="lps-card-right">
                          <button
                            type="button"
                            className="lps-btn-detail"
                            onClick={() =>
                              navigate(
                                `/laporan/${encodeURIComponent(normId)}`,
                                {
                                  state: {
                                    from: '/laporan-saya',
                                    fromLabel: 'Laporan Saya',
                                  },
                                }
                              )
                            }
                          >
                            Lihat Detail
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* KONDISI 3: Pencarian / Filter Tidak Ditemukan (Empty state dengan ikon search & tombol reset) */
                <div className="lps-empty-card lps-not-found-card">
                  <div className="lps-not-found-icon-wrap" aria-hidden="true">
                    <SearchMagnifierIcon size={22} />
                  </div>
                  <h2 className="lps-empty-title">Laporan tidak ditemukan</h2>
                  <p className="lps-empty-desc">
                    {searchQuery.trim()
                      ? `Tidak ada laporan yang cocok dengan “${searchQuery.trim()}”. Coba kata kunci lain atau atur ulang filter.`
                      : selectedStatus !== 'Semua Status'
                      ? `Tidak ada laporan dengan status “${selectedStatus}”. Coba pilih status lain atau atur ulang filter.`
                      : 'Tidak ada laporan yang cocok. Coba atur ulang filter.'}
                  </p>
                  <button
                    type="button"
                    className="lps-btn-outline"
                    onClick={handleResetFilters}
                  >
                    Atur Ulang Filter
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
