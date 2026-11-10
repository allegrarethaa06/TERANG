import { useState } from 'react';
import { SAMPLE_REPORTS, DEMO_STATISTICS } from '../data/reportsData';

export default function ContohLaporan({ onSelectReport, onOpenCreateModal }) {
  const [activeCategory, setActiveCategory] = useState('Semua');

  const categories = ['Semua', 'Jalan Rusak', 'Drainase', 'Penerangan Jalan'];

  const filteredReports = activeCategory === 'Semua'
    ? SAMPLE_REPORTS
    : SAMPLE_REPORTS.filter((r) => r.category === activeCategory);

  return (
    <section className="section-wrapper reports-section" id="contoh-laporan">
      <div className="container">
        {/* Header */}
        <div className="reports-head-row">
          <div>
            <h2 className="section-heading">Laporan Terkini di Kecamatan Coblong</h2>
            <p className="section-subtext">
              <span className="badge badge-simulated inline-simulated-badge">Simulasi Coblong</span> Daftar laporan aktif di lingkungan Kelurahan Lebakgede, Sekeloa, Dago, dan Lebak Siliwangi.
              Setiap laporan dapat dibuka untuk memeriksa riwayat keputusan petugas dan sumber pengadaan terkait.
            </p>
          </div>

          <div className="reports-head-action">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenCreateModal}
            >
              + Buat Laporan Baru
            </button>
          </div>
        </div>

        {/* Live Coblong Demo Metrics Strip */}
        <div className="metrics-strip" data-ui="metrics">
          <div className="metric-box">
            <span className="metric-val">{DEMO_STATISTICS.totalReports}</span>
            <span className="metric-lbl">Total Laporan Masuk</span>
          </div>
          <div className="metric-box">
            <span className="metric-val">{DEMO_STATISTICS.uniqueIssues}</span>
            <span className="metric-lbl">Masalah Unik Terdaftar</span>
          </div>
          <div className="metric-box">
            <span className="metric-val highlight-metric">{DEMO_STATISTICS.recurringDetected}</span>
            <span className="metric-lbl">Indikasi Rusak Berulang</span>
          </div>
          <div className="metric-box">
            <span className="metric-val">{DEMO_STATISTICS.completed}</span>
            <span className="metric-lbl">Selesai dan Dikonfirmasi</span>
          </div>
          <div className="metric-box">
            <span className="metric-val">{DEMO_STATISTICS.avgResponseTime}</span>
            <span className="metric-lbl">Rata-rata Waktu Verifikasi</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="filter-bar" data-ui="filters">
          <div className="filter-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
                {cat === 'Semua' ? ` (${SAMPLE_REPORTS.length})` : ` (${SAMPLE_REPORTS.filter((r) => r.category === cat).length})`}
              </button>
            ))}
          </div>

          <div className="filter-note">
            <span>Peta Cakupan: Radius Coblong (Kota Bandung)</span>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="reports-grid">
          {filteredReports.map((report) => (
            <article key={report.id} className="report-card">
              {/* Card Photo Preview */}
              <div className="card-media">
                <img
                  src={report.photoUrl}
                  alt={report.title}
                  className="card-img"
                  loading="lazy"
                  width="1920"
                  height="1440"
                />
                <div className="card-floating-badges">
                  <span className="badge badge-simulated">Simulasi</span>
                  {report.radarDetails?.isRecurring && (
                    <span className="badge badge-urgent-most">Radar: Berulang</span>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="card-content">
                <div className="card-meta-top">
                  <span className="card-id">{report.id}</span>
                  <span className="card-category">{report.category}</span>
                  <span className="card-ward">Kel. {report.ward}</span>
                </div>

                <h3 className="card-title">{report.title}</h3>

                <p className="card-address">
                  {report.address}
                </p>

                <p className="card-excerpt">
                  {report.description}
                </p>

                {/* Status and Urgency Badges */}
                <div className="card-status-row">
                  <div className="badges-pair">
                    <span className={`badge ${
                      report.status === 'Dalam Penanganan' ? 'badge-status-progress' :
                      report.status === 'Terverifikasi' ? 'badge-status-verified' :
                      report.status === 'Menunggu Konfirmasi' ? 'badge-status-confirmation' : 'badge-status-done'
                    }`}>
                      {report.status}
                    </span>
                    <span className={`badge ${
                      report.urgency === 'Most Urgent' ? 'badge-urgent-most' :
                      report.urgency === 'Urgent' ? 'badge-urgent' : 'badge-not-urgent'
                    }`}>
                      {report.urgency}
                    </span>
                  </div>

                  <span className="card-observed-date">{report.observedDate}</span>
                </div>

                {/* Action Button */}
                <div className="card-footer">
                  <button
                    type="button"
                    className="card-open-btn"
                    onClick={() => onSelectReport(report)}
                  >
                    <span>Buka Rincian dan Jejak Lengkap</span>
                    <span className="arrow-sym">→</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .reports-section {
          background-color: var(--c-white);
        }
        .reports-head-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
          margin-bottom: 36px;
        }
        .tag-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .reports-head-action {
          align-self: flex-start;
        }
        
        /* Metrics Strip */
        .metrics-strip {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          background-color: var(--c-warm-white);
          border-radius: var(--radius-lg);
          padding: 24px;
          margin-bottom: 36px;
        }
        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-right: 16px;
        }
        .metric-box:last-child {
          padding-right: 0;
        }
        .metric-val {
          font-size: 1.85rem;
          font-weight: 850;
          color: var(--c-navy);
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .highlight-metric {
          color: #B45309;
        }
        .metric-lbl {
          font-size: 0.875rem;
          color: var(--c-text-sec);
          line-height: 1.35;
        }

        /* Filter Bar */
        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
          padding-bottom: 18px;
        }
        .filter-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-chip {
          font-size: 0.875rem;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          background-color: var(--c-warm-white);
          color: var(--c-navy);
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .filter-chip.active {
          background-color: var(--c-navy);
          color: var(--c-warm-white);
        }
        .filter-note {
          font-size: 0.875rem;
          color: var(--c-text-sec);
          font-weight: 500;
        }

        /* Grid */
        .reports-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px;
        }
        .report-card {
          background-color: var(--c-warm-white);
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease;
        }
        .report-card:hover {
          transform: translateY(-2px);
        }
        .card-media {
          position: relative;
          width: 100%;
          height: 200px;
          background-color: #E2E8F0;
          overflow: hidden;
        }
        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .card-floating-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-content {
          padding: 22px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .card-meta-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .card-id {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--c-navy);
          background-color: #E2E8F0;
          padding: 2px 7px;
          border-radius: var(--radius-sm);
        }
        .card-category {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--c-teal);
        }
        .card-ward {
          font-size: 0.875rem;
          color: var(--c-text-sec);
        }
        .card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--c-navy);
          line-height: 1.35;
          margin-bottom: 6px;
        }
        .card-address {
          font-size: 0.875rem;
          color: var(--c-text-sec);
          margin-bottom: 12px;
        }
        .card-excerpt {
          font-size: 1rem;
          color: var(--c-navy);
          line-height: 1.5;
          margin-bottom: 18px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          margin-top: auto;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .badges-pair {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .card-observed-date {
          font-size: 0.875rem;
          color: var(--c-text-sec);
        }
        .card-footer {
          padding-top: 4px;
        }
        .card-open-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          background-color: var(--c-white);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--c-navy);
          transition: background-color 0.15s ease;
        }
        .card-open-btn:hover {
          background-color: var(--c-yellow-soft);
        }
        .arrow-sym {
          font-size: 1rem;
          transition: transform 0.15s ease;
        }
        .card-open-btn:hover .arrow-sym {
          transform: translateX(4px);
        }

        @media (max-width: 992px) {
          .reports-grid {
            grid-template-columns: 1fr;
          }
          .metrics-strip {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .metrics-strip {
            grid-template-columns: 1fr;
          }
          .metric-box {
            padding-bottom: 12px;
          }
        }
      `}</style>
    </section>
  );
}
