import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deduplicateReports } from '../services/authService';
import AppNavbar from './AppNavbar';
import './DashboardPage.css';

export default function DashboardPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [emptyIconError, setEmptyIconError] = useState(false);

  // Nama diambil secara dinamis dari akun yang sedang login
  const displayName =
    user?.fullName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Warga TERANG');
  const userReports = deduplicateReports(Array.isArray(user?.reports) ? user.reports : []);

  return (
    <div className="dashboard-page">
      {/* Top Navbar Responsif TERANG dengan Mobile Hamburger */}
      <AppNavbar user={user} onLogout={onLogout} currentPage="dashboard" />

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
