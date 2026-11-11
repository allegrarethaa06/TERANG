import AppNavbar from './AppNavbar';
import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { deduplicateReports } from '../services/authService';
import { SAMPLE_REPORTS } from '../data/reportsData';
import { TRANSPARANSI_REPORTS } from '../data/transparansiData';
import './DashboardPage.css';
import './DetailLaporanPage.css';

function resolveReportCoordinates(report) {
  if (!report) return null;
  if (
    Number.isFinite(Number(report.latitude)) &&
    Number.isFinite(Number(report.longitude))
  ) {
    return {
      latitude: Number(report.latitude),
      longitude: Number(report.longitude),
    };
  }
  if (typeof report.coordinates === 'string' && report.coordinates.includes(',')) {
    const parts = report.coordinates.split(',').map((s) => Number(s.trim()));
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return {
        latitude: parts[0],
        longitude: parts[1],
      };
    }
  }
  return null;
}

function getStatusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('selesai')) return 'status-done';
  if (s.includes('penanganan')) return 'status-progress';
  if (s.includes('konfirmasi')) return 'status-confirm';
  if (s.includes('ditutup')) return 'status-closed';
  if (s.includes('terverifikasi') && !s.includes('menunggu')) return 'status-verified';
  return 'status-pending';
}

function formatSafetyRiskAnswer(raw) {
  if (!raw) return 'Tidak Yakin';
  const trimmed = String(raw).trim();
  if (trimmed.toLowerCase() === 'ya') return 'Ya';
  if (trimmed.toLowerCase() === 'tidak') return 'Tidak';
  if (trimmed.toLowerCase() === 'tidak yakin' || trimmed.toLowerCase() === 'ragu-ragu') return 'Tidak Yakin';

  const lower = trimmed.toLowerCase();
  if (lower.includes('berisiko') || lower.includes('tinggi') || lower.includes('bahaya') || lower.includes('sedang')) {
    return 'Ya';
  }
  if (lower.includes('rendah') || lower.includes('tidak berisiko')) {
    return 'Tidak';
  }
  return 'Tidak Yakin';
}

function formatTimelineDate(dateStr) {
  if (!dateStr) return { date: '', time: '' };
  const str = String(dateStr).trim();

  // If format has comma separating date and time (e.g. "12 Mei 2026, 09:20 WIB")
  if (str.includes(',')) {
    const commaIndex = str.indexOf(',');
    return {
      date: str.slice(0, commaIndex).trim(),
      time: str.slice(commaIndex + 1).trim(),
    };
  }

  // If format has "WIB" without comma, e.g. "12 Mei 2026 09:20 WIB"
  const wibMatch = str.match(/^(.*?)(\d{1,2}[:.]\d{2}(?:\s*WIB)?)$/i);
  if (wibMatch) {
    return {
      date: wibMatch[1].trim(),
      time: wibMatch[2].trim(),
    };
  }

  return { date: str, time: '' };
}

const TERANG_MARKER_ICON = L.divIcon({
  className: 'terang-map-marker-icon',
  html: `
    <div class="terang-pin-wrap" aria-hidden="true">
      <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 1.5C8.8873 1.5 1.5 8.8873 1.5 18C1.5 29.25 18 42.2 18 42.2C18 42.2 34.5 29.25 34.5 18C34.5 8.8873 27.1127 1.5 18 1.5Z" fill="#271A62" stroke="#FFFFFF" stroke-width="2.5"/>
        <circle cx="18" cy="17.5" r="7.5" fill="#FFFF6B" stroke="#271A62" stroke-width="1.5"/>
      </svg>
    </div>
  `,
  iconSize: [36, 44],
  iconAnchor: [18, 42],
  popupAnchor: [0, -38],
});

export default function DetailLaporanPage({ user, onLogout }) {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const userReports = deduplicateReports(Array.isArray(user?.reports) ? user.reports : []);
  const allReports = [...userReports, ...SAMPLE_REPORTS, ...TRANSPARANSI_REPORTS];
  const decodedId = reportId ? decodeURIComponent(reportId) : '';
  const cleanDecodedId = decodedId.replace(/^#/, '');
  const report =
    allReports.find(
      (item) =>
        item &&
        (item.id === decodedId ||
          String(item.id).replace(/^#/, '') === cleanDecodedId)
    ) || null;
  const resolvedCoords = resolveReportCoordinates(report);

  // Navigasi Kembali dinamis sesuai asal pengguna
  const fromState = location.state?.from;
  const fromLabel = location.state?.fromLabel;

  const handleBack = () => {
    if (fromState) {
      navigate(fromState);
      return;
    }
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }
    navigate(user ? '/dashboard' : '/peta-laporan');
  };

  // Keyboard escape for lightbox
  useEffect(() => {
    if (!lightboxPhoto) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxPhoto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto]);

  if (!report) {
    return <Navigate to={user ? '/dashboard' : '/peta-laporan'} replace />;
  }

  const photos =
    Array.isArray(report.photoPreviews) && report.photoPreviews.length > 0
      ? report.photoPreviews.filter((p) => p && p.previewUrl)
      : report.photoUrl
      ? [
          {
            id: `${report.id}-photo-1`,
            name: report.title || report.id,
            previewUrl: report.photoUrl,
          },
        ]
      : [];

  const riskAnswer = formatSafetyRiskAnswer(report.safetyImpact);

  // Normalize Decision Timeline from either report.timeline or report.decisionTrail
  const timelineSteps = Array.isArray(report.timeline)
    ? report.timeline
    : Array.isArray(report.decisionTrail)
    ? report.decisionTrail.map((item, idx) => ({
        key: `step-${item.step || idx}`,
        date: item.time || '',
        title: item.action || item.actor || 'Tahap Penanganan',
        note: item.note || (item.actor ? `Dilakukan oleh ${item.actor}` : ''),
        isCurrent: idx === report.decisionTrail.length - 1,
      }))
    : null;

  const isRecurring = Boolean(report.radarDetails?.isRecurring || report.radarStatus?.includes('Berulang'));

  return (
    <div className="detail-laporan-page">
      {/* Navbar TERANG */}
      <AppNavbar user={user} onLogout={onLogout} currentPage="" />

      {/* Main Content Detail Laporan */}
      <main className="detail-laporan-main">
        {/* Topbar: Satu Tombol Kembali Dinamis + Simulasi Pill */}
        <div className="detail-laporan-topbar">
          <button
            type="button"
            className="detail-laporan-back-btn"
            onClick={handleBack}
            aria-label={`Kembali ke ${fromLabel || 'halaman sebelumnya'}`}
          >
            <span aria-hidden="true">←</span>
            <span>{fromLabel ? `Kembali ke ${fromLabel}` : 'Kembali ke Dashboard'}</span>
          </button>

          <span className="detail-laporan-simulasi-pill">Data simulasi</span>
        </div>

        {/* 1. HEADER CARD: Judul Laporan Jadi Fokus Utama, Metadata Rapi, Status Jelas */}
        <header className="detail-laporan-header-card" aria-labelledby="detail-title">
          <div className="detail-laporan-header-main">
            <h1 id="detail-title" className="detail-laporan-title">
              {report.title || report.category || 'Laporan Kerusakan'}
            </h1>

            <div className="detail-laporan-meta-bar">
              <span className="detail-laporan-id-badge">{report.id}</span>
              {report.category && (
                <span className="detail-laporan-cat-badge">{report.category}</span>
              )}
              <span className="detail-laporan-meta-dot">•</span>
              <span className="detail-laporan-meta-text">
                Dilaporkan {report.createdAt || report.reportedAt || 'Baru saja'}
              </span>
              <span className="detail-laporan-meta-dot">•</span>
              <span className="detail-laporan-meta-text">
                Pelapor: {report.reporterPublicName || 'Warga Terverifikasi'}
              </span>
            </div>
          </div>

          <span className={`detail-laporan-status-pill ${getStatusBadgeClass(report.status)}`}>
            {report.status || 'Menunggu Verifikasi'}
          </span>
        </header>

        {/* 2. DUA KOLOM SEIMBANG: Kolom Kiri (Lokasi & Mini Map) vs Kolom Kanan (Foto, Deskripsi, Risiko) */}
        <div className="detail-laporan-two-col">
          {/* Kolom Kiri: Lokasi & Mini Map */}
          <section className="detail-laporan-card-block" aria-labelledby="detail-loc-heading">
            <div className="detail-laporan-block-head">
              <h2 id="detail-loc-heading" className="detail-laporan-section-title">
                Lokasi Kerusakan
              </h2>
            </div>

            <div className="detail-laporan-address-box">
              <p className="detail-laporan-address-text">
                {report.address || report.location}
              </p>
              {report.coordinates && (
                <p className="detail-laporan-coords-text">
                  Koordinat: {report.coordinates}
                </p>
              )}
            </div>

            {resolvedCoords && (
              <div className="detail-laporan-map-wrap">
                <MapContainer
                  center={[resolvedCoords.latitude, resolvedCoords.longitude]}
                  zoom={17}
                  scrollWheelZoom={false}
                  dragging={false}
                  doubleClickZoom={false}
                  touchZoom={false}
                  zoomControl={false}
                  className="detail-laporan-map"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker
                    position={[resolvedCoords.latitude, resolvedCoords.longitude]}
                    icon={TERANG_MARKER_ICON}
                  />
                </MapContainer>
              </div>
            )}

            {/* Jawaban Risiko Keselamatan: Ya, Tidak, atau Tidak Yakin */}
            <div className="detail-laporan-risk-section">
              <span className="detail-laporan-risk-label">
                Apakah kerusakan ini berpotensi membahayakan warga?
              </span>
              <span className={`detail-laporan-risk-badge risk-${riskAnswer.toLowerCase().replace(/\s+/g, '-')}`}>
                {riskAnswer}
              </span>
            </div>
          </section>

          {/* Kolom Kanan: Foto Bukti & Deskripsi Kerusakan */}
          <section className="detail-laporan-card-block" aria-labelledby="detail-photo-heading">
            <div className="detail-laporan-block-head">
              <h2 id="detail-photo-heading" className="detail-laporan-section-title">
                Foto Bukti & Deskripsi
              </h2>
              <span className="detail-laporan-coords-text">
                {photos.length} foto terlampir
              </span>
            </div>

            {/* Galeri Foto Asli (Klik untuk Diperbesar) */}
            {photos.length > 0 ? (
              <div className="detail-laporan-photos-grid">
                {photos.map((p, idx) => (
                  <button
                    key={p.id || `photo-${idx}`}
                    type="button"
                    className="detail-laporan-photo-btn"
                    onClick={() => setLightboxPhoto(p)}
                    aria-label={`Perbesar foto ${idx + 1}`}
                  >
                    <img
                      src={p.previewUrl}
                      alt={p.name || `Foto bukti ${idx + 1}`}
                      className="detail-laporan-photo-img"
                    />
                    <span className="detail-laporan-photo-hint">
                      <span>
                        {report.isDemoData
                          ? 'Foto ilustrasi · Data simulasi'
                          : p.name || `Foto ${idx + 1}`}
                      </span>
                      <span aria-hidden="true">🔍</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="detail-laporan-coords-text">
                {report.photoCount ? `${report.photoCount} foto terlampir` : 'Tidak ada foto terlampir'}
              </p>
            )}

            {/* Deskripsi Kerusakan Dekat Foto */}
            <div className="detail-laporan-desc-section">
              <span className="detail-laporan-desc-label">Deskripsi Kerusakan:</span>
              <p className="detail-laporan-desc-text">
                {report.description || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>
          </section>
        </div>

        {/* 3. ALASAN PRIORITAS AWAL — Section Card Terpisah dengan Background #FFFEE8 */}
        {(report.reasons || report.urgencyReason || report.reasonSummary) && (
          <section className="detail-laporan-priority-card" aria-labelledby="detail-priority-heading">
            <div className="detail-laporan-priority-header">
              <h2 id="detail-priority-heading" className="detail-laporan-section-title">
                Alasan Prioritas Awal
              </h2>
              {report.priorityVerified && (
                <span className="detail-laporan-priority-verified">
                  Diverifikasi admin {report.priorityVerifiedAt ? `• ${report.priorityVerifiedAt}` : ''}
                </span>
              )}
            </div>

            <p className="detail-laporan-priority-disclaimer">
              Rekomendasi awal sistem berdasarkan analisis laporan warga, belum menjadi keputusan akhir. Keputusan akhir diverifikasi dan ditetapkan oleh admin.
            </p>

            {report.reasonSummary && (
              <p className="detail-laporan-priority-summary">{report.reasonSummary}</p>
            )}

            {Array.isArray(report.reasons) && report.reasons.length > 0 ? (
              <div className="detail-laporan-reasons-grid">
                {report.reasons.map((r, idx) => (
                  <div key={r.title || idx} className="detail-laporan-reason-item">
                    <span className="detail-laporan-reason-num">{idx + 1}</span>
                    <div>
                      <p className="detail-laporan-reason-title">{r.title}</p>
                      <p className="detail-laporan-reason-desc">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : report.urgencyReason ? (
              <div className="detail-laporan-reason-item" style={{ maxWidth: '640px' }}>
                <span className="detail-laporan-reason-num">!</span>
                <div>
                  <p className="detail-laporan-reason-title">Tingkat Urgensi: {report.urgency || 'Urgent'}</p>
                  <p className="detail-laporan-reason-desc">{report.urgencyReason}</p>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* 4. RADAR RUSAK LAGI — HANYA JIKA ADA INDIKASI KERUSAKAN BERULANG */}
        {isRecurring && report.radarDetails && (
          <section className="detail-laporan-radar-card" aria-labelledby="detail-radar-heading">
            <span className="detail-laporan-radar-badge">
              <span aria-hidden="true">!</span> Indikasi Kerusakan Berulang (Radar Rusak Lagi)
            </span>
            <div className="detail-laporan-radar-grid">
              <div>
                <p className="detail-laporan-radar-cell-label">Laporan Sebelumnya</p>
                <p className="detail-laporan-radar-cell-val">{report.radarDetails.linkedReportId || '-'}</p>
              </div>
              <div>
                <p className="detail-laporan-radar-cell-label">Waktu Perbaikan Sebelumnya</p>
                <p className="detail-laporan-radar-cell-val">{report.radarDetails.previousFixDate || '-'}</p>
              </div>
              <div>
                <p className="detail-laporan-radar-cell-label">Selisih Waktu Rusak Kembali</p>
                <p className="detail-laporan-radar-cell-val">{report.radarDetails.intervalDays ? `${report.radarDetails.intervalDays} hari` : '-'}</p>
              </div>
            </div>
            {report.radarDetails.rootCauseHypothesis && (
              <p className="detail-laporan-radar-desc">
                <strong>Analisis Akar Masalah:</strong> {report.radarDetails.rootCauseHypothesis}
              </p>
            )}
          </section>
        )}

        {/* 5. JEJAK KEPUTUSAN — Timeline Mudah Dipindai */}
        {timelineSteps && timelineSteps.length > 0 && (
          <section className="detail-laporan-trail-card" aria-labelledby="detail-trail-heading">
            <h2 id="detail-trail-heading" className="detail-laporan-section-title">
              Jejak Keputusan
            </h2>
            <ol className="detail-laporan-timeline">
              {timelineSteps.map((step) => {
                const { date: datePart, time: timePart } = formatTimelineDate(step.date);
                return (
                  <li
                    key={step.key || step.title}
                    className={`detail-laporan-timeline-step ${step.isCurrent ? 'current' : ''}`}
                  >
                    {/* Area 1: Tanggal & Waktu */}
                    <div className="detail-laporan-step-time">
                      <span className="detail-laporan-step-date">{datePart}</span>
                      {timePart && (
                        <span className="detail-laporan-step-clock">{timePart}</span>
                      )}
                    </div>

                    {/* Area 2: Indikator Timeline (Bulatan & Garis Vertikal) */}
                    <div className="detail-laporan-step-indicator" aria-hidden="true">
                      <span className="detail-laporan-step-dot" />
                      <span className="detail-laporan-step-line" />
                    </div>

                    {/* Area 3: Deskripsi Keputusan */}
                    <div className="detail-laporan-step-content">
                      <p className="detail-laporan-step-title">
                        <span className="detail-laporan-step-title-text">{step.title}</span>
                        {step.isCurrent && (
                          <span className="detail-laporan-step-current-tag">Tahap terkini</span>
                        )}
                      </p>
                      {step.note && (
                        <p className="detail-laporan-step-note">{step.note}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* 6. JEJAK ANGGARAN — Sederhana & Tanpa Angka Fiktif */}
        <section className="detail-laporan-budget-card" aria-labelledby="detail-budget-heading">
          <div className="detail-laporan-budget-head">
            <h2 id="detail-budget-heading" className="detail-laporan-section-title">
              Jejak Anggaran
            </h2>
            <span className="detail-laporan-budget-badge">
              {report.budgetTrail?.linkageStatus || 'Belum terverifikasi'}
            </span>
          </div>

          <div className="detail-laporan-budget-box">
            <p className="detail-laporan-budget-text">
              {report.budgetTrail?.packageName || 'Belum ada informasi anggaran terverifikasi.'}
            </p>
          </div>

          <p className="detail-laporan-budget-note">
            {report.budgetTrail?.disclaimer ||
              'Data anggaran akan tampil setelah diverifikasi oleh dinas terkait. Tidak ada angka yang ditampilkan sebelum verifikasi resmi.'}
          </p>
        </section>
      </main>

      {/* LIGHTBOX MODAL PREVIEW FOTO */}
      {lightboxPhoto && (
        <div
          className="detail-lightbox-overlay"
          onClick={() => setLightboxPhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto diperbesar"
        >
          <div
            className="detail-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="detail-lightbox-close"
              onClick={() => setLightboxPhoto(null)}
              aria-label="Tutup pratinjau foto"
            >
              ✕
            </button>
            <img
              src={lightboxPhoto.previewUrl}
              alt={lightboxPhoto.name}
              className="detail-lightbox-img"
            />
            {lightboxPhoto.name && (
              <p className="detail-lightbox-caption">
                {lightboxPhoto.name}
                {report.isDemoData && ' • Foto ilustrasi · Data simulasi'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
