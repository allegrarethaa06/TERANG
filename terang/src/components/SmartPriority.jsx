import { useState } from 'react';

export default function SmartPriority() {
  const [activeScenario, setActiveScenario] = useState('different');

  return (
    <section className="section-wrapper priority-section" id="smart-priority">
      <div className="container">
        {/* Header */}
        <div className="section-head-center">
          <h2 className="section-heading">Smart Priority dan Human Crosscheck</h2>
          <p className="section-subtext">
            Bukan kontes popularitas atau voting like terbanyak. Prioritas penanganan dinilai dari risiko keselamatan nyata
            dan diverifikasi oleh manusia, bukan sekadar algoritma otomatis.
          </p>
        </div>

        {/* 2-Column Core Architecture */}
        <div className="priority-core-grid">
          {/* Column A: Smart Priority Framework */}
          <div className="framework-card">
            <div className="card-badge-row">
              <span className="framework-pill">Smart Priority</span>
              <span className="framework-sub">3 Tingkat Urgensi Terpisah</span>
            </div>

            <h3 className="card-main-title">Penetapan Urgensi Berdasarkan Dampak Keselamatan</h3>
            <p className="card-main-desc">
              Di TERANG, warga pelapor tidak memilih sendiri level kedaruratan. Sistem memberikan rekomendasi
              berdasarkan parameter objektif, lalu verifikator manusia menetapkan urgensi final beserta alasannya.
            </p>

            <div className="urgency-matrix">
              <div className="urgency-row most-urgent-row">
                <div className="urgency-header-cell">
                  <span className="badge badge-urgent-most">Most Urgent</span>
                  <span className="urgency-criteria">Risiko Fatalitas Segera</span>
                </div>
                <p className="urgency-exp">
                  Kedalaman amblesan &gt;10 cm di lajur utama, jalan turunan curam, atau jembatan patah yang langsung mengancam keselamatan jiwa pengguna jalan saat hujan.
                </p>
              </div>

              <div className="urgency-row urgent-row">
                <div className="urgency-header-cell">
                  <span className="badge badge-urgent">Urgent</span>
                  <span className="urgency-criteria">Gangguan Mobilitas dan Kerusakan Meluas</span>
                </div>
                <p className="urgency-exp">
                  Saluran drainase meluap ke badan jalan, lubang aspal 5–10 cm di kawasan permukiman padat, atau lampu jalan padam berurutan.
                </p>
              </div>

              <div className="urgency-row not-urgent-row">
                <div className="urgency-header-cell">
                  <span className="badge badge-not-urgent">Not Urgent</span>
                  <span className="urgency-criteria">Pemeliharaan Ringan / Rutin</span>
                </div>
                <p className="urgency-exp">
                  Retak rambut pada aspal, cat marka memudar, atau trotoar sompal ringan yang tidak menimbulkan hambatan laju kendaraan.
                </p>
              </div>
            </div>

            {/* Priority Aging Mechanism Box */}
            <div className="aging-callout">
              <div className="aging-head">
                <strong>Mekanisme Anti-Penelantaran (Priority Aging)</strong>
              </div>
              <p className="aging-body">
                Laporan bertaraf <em>Not Urgent</em> tidak boleh terlupakan selamanya. Sistem memicu pengingat antrean
                pada hari ke-7, eskalasi peninjauan pada hari ke-14, dan rekomendasi penjadwalan berkala pada hari ke-21.
              </p>
            </div>
          </div>

          {/* Column B: Human Crosscheck & 50m Radius Simulation */}
          <div className="framework-card">
            <div className="card-badge-row">
              <span className="framework-pill crosscheck-pill">Human Crosscheck</span>
              <span className="framework-sub">Radius Deteksi 50 Meter</span>
            </div>

            <h3 className="card-main-title">Pemeriksaan Laporan Sekitar dan Anti-Duplikasi</h3>
            <p className="card-main-desc">
              Ketika dua warga melapor di jalan yang sama, apakah itu laporan ganda atau dua lubang berbeda?
              Jarak dekat bukan vonis. Verifikator manusia membandingkan foto dan rincian sebelum mengambil keputusan.
            </p>

            {/* Interactive Simulation Switcher */}
            <div className="simulation-scenario-switcher">
              <span className="scenario-label">Simulasikan Skenario Lapangan:</span>
              <div className="scenario-tabs">
                <button
                  type="button"
                  className={`scenario-btn ${activeScenario === 'different' ? 'active' : ''}`}
                  onClick={() => setActiveScenario('different')}
                >
                  Kasus 1: Masalah Berbeda (18m)
                </button>
                <button
                  type="button"
                  className={`scenario-btn ${activeScenario === 'duplicate' ? 'active' : ''}`}
                  onClick={() => setActiveScenario('duplicate')}
                >
                  Kasus 2: Potensi Duplikat (6m)
                </button>
              </div>
            </div>

            {/* Scenario Display Box */}
            {activeScenario === 'different' ? (
              <div className="crosscheck-demo-box" data-ui="simulation">
                <div className="demo-header-info">
                  <span className="demo-location">Lokasi: Jl. Sekeloa Utara Gang 3</span>
                  <span className="badge badge-simulated">Hasil: Kasus Berbeda</span>
                </div>

                <div className="two-reports-compare">
                  <div className="report-mini-card">
                    <span className="report-chip">Laporan A (#TRG-092)</span>
                    <strong>Saluran Air Meluap</strong>
                    <span>Kategori: Drainase</span>
                    <span className="meta-dist">Titik: Depan Pos RT 02</span>
                  </div>

                  <div className="compare-separator">
                    <span className="dist-tag">Jarak 18m</span>
                    <span className="vs-sign">≠</span>
                  </div>

                  <div className="report-mini-card">
                    <span className="report-chip">Laporan B (#TRG-095)</span>
                    <strong>Tutup Saluran Pecah</strong>
                    <span>Kategori: Drainase / Fasilitas</span>
                    <span className="meta-dist">Titik: Tikungan Gang 3</span>
                  </div>
                </div>

                <div className="verdict-box verdict-valid">
                  <strong>Keputusan Human Crosscheck:</strong>
                  <p>
                    "Dua laporan berjarak 18 meter disetujui sebagai <strong>Masalah Berbeda</strong>. Laporan B tidak digabung ke Laporan A karena objek fisiknya berbeda (saluran tersumbat vs tutup beton patah)."
                  </p>
                </div>
              </div>
            ) : (
              <div className="crosscheck-demo-box" data-ui="simulation">
                <div className="demo-header-info">
                  <span className="demo-location">Lokasi: Jl. Dipatiukur (Dekat Halte Kampus)</span>
                  <span className="badge badge-simulated">Hasil: Ditautkan sebagai Duplikat</span>
                </div>

                <div className="two-reports-compare">
                  <div className="report-mini-card">
                    <span className="report-chip">Laporan Utama (#TRG-088)</span>
                    <strong>Ambles Bahu Jalan</strong>
                    <span>Dilaporkan 01 Mar 08:15</span>
                    <span className="meta-dist">Status: Dalam Penanganan</span>
                  </div>

                  <div className="compare-separator">
                    <span className="dist-tag">Jarak 6m</span>
                    <span className="vs-sign">=</span>
                  </div>

                  <div className="report-mini-card">
                    <span className="report-chip">Laporan Baru (#TRG-090)</span>
                    <strong>Lubang Aspal Halte</strong>
                    <span>Dilaporkan 01 Mar 11:30</span>
                    <span className="meta-dist">Status: Menunggu Triage</span>
                  </div>
                </div>

                <div className="verdict-box verdict-linked">
                  <strong>Keputusan Human Crosscheck:</strong>
                  <p>
                    "Laporan #TRG-090 diverifikasi sebagai lubang yang sama persis dengan #TRG-088. Status diubah menjadi <strong>Ditautkan sebagai Duplikat</strong>. Pelapor kedua otomatis menerima kabar perkembangan penanganan Laporan Utama."
                  </p>
                </div>
              </div>
            )}

            <div className="crosscheck-footer-rule">
              <span>
                Prinsip PRD: Warga yang tidak puas terhadap keputusan duplikat dapat mengajukan <em>Tinjau Ulang</em> tanpa harus membuat ID baru yang membebani antrean.
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .priority-section {
          background-color: var(--c-warm-white);
        }
        .priority-core-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: stretch;
        }
        .framework-card {
          background-color: var(--c-white);
          border-radius: var(--radius-lg);
          padding: clamp(24px, 3.5vw, 36px);
          display: flex;
          flex-direction: column;
        }
        .card-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .framework-pill {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--c-navy);
          background-color: var(--c-yellow);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
        }
        .crosscheck-pill {
          background-color: var(--c-teal-light);
          color: var(--c-teal);
        }
        .framework-sub {
          font-size: 0.875rem;
          color: var(--c-text-sec);
          font-weight: 500;
        }
        .card-main-title {
          font-size: clamp(20px, 2vw, 24px);
          font-weight: 800;
          color: var(--c-navy);
          margin-bottom: 10px;
          line-height: 1.3;
        }
        .card-main-desc {
          font-size: 1rem;
          color: var(--c-text-sec);
          line-height: 1.55;
          margin-bottom: 24px;
        }

        /* Matrix */
        .urgency-matrix {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .urgency-row {
          border-radius: var(--radius-md);
          padding: 14px 16px;
          background-color: var(--c-warm-white);
        }
        .most-urgent-row {
          border-left: 4px solid var(--c-urgent-text);
        }
        .urgent-row {
          border-left: 4px solid var(--c-warning-text);
        }
        .not-urgent-row {
          border-left: 4px solid #94A3B8;
        }
        .urgency-header-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .urgency-criteria {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--c-navy);
        }
        .urgency-exp {
          font-size: 1rem;
          color: var(--c-text-sec);
          line-height: 1.45;
        }

        /* Aging Box */
        .aging-callout {
          background-color: #F8FAFC;
          border-radius: var(--radius-md);
          padding: 14px 18px;
          margin-top: auto;
        }
        .aging-head {
          font-size: 0.875rem;
          color: var(--c-navy);
          margin-bottom: 6px;
        }
        .aging-body {
          font-size: 0.875rem;
          color: var(--c-text-sec);
          line-height: 1.45;
        }

        /* Simulation Switcher */
        .simulation-scenario-switcher {
          margin-bottom: 18px;
        }
        .scenario-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--c-text-sec);
          margin-bottom: 8px;
        }
        .scenario-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .scenario-btn {
          font-size: 0.875rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          background-color: #F1F4F9;
          color: var(--c-navy);
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .scenario-btn.active {
          background-color: var(--c-navy);
          color: var(--c-warm-white);
        }

        /* Demo Box */
        .crosscheck-demo-box {
          background-color: var(--c-warm-white);
          border-radius: var(--radius-md);
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }
        .demo-header-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .demo-location {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--c-navy);
        }
        .two-reports-compare {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 12px;
          align-items: center;
        }
        .report-mini-card {
          background-color: var(--c-white);
          border-radius: var(--radius-sm);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .report-chip {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--c-teal);
        }
        .report-mini-card strong {
          font-size: 1rem;
          color: var(--c-navy);
        }
        .report-mini-card span {
          font-size: 0.875rem;
          color: var(--c-text-sec);
        }
        .meta-dist {
          font-weight: 600;
          color: var(--c-navy) !important;
        }
        .compare-separator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .dist-tag {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--c-navy);
          background-color: var(--c-yellow);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          white-space: nowrap;
        }
        .vs-sign {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--c-text-sec);
        }
        .verdict-box {
          border-radius: var(--radius-sm);
          padding: 12px 14px;
        }
        .verdict-valid {
          background-color: #EEF8F3;
          border-left: 3px solid var(--c-success-text);
        }
        .verdict-linked {
          background-color: #EFF6FF;
          border-left: 3px solid #2563EB;
        }
        .verdict-box strong {
          display: block;
          font-size: 0.875rem;
          color: var(--c-navy);
          margin-bottom: 2px;
        }
        .verdict-box p {
          font-size: 1rem;
          color: var(--c-navy);
          line-height: 1.45;
        }
        .crosscheck-footer-rule {
          margin-top: auto;
          font-size: 0.875rem;
          color: var(--c-text-sec);
          line-height: 1.45;
          padding-top: 12px;
        }

        @media (max-width: 992px) {
          .priority-core-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 580px) {
          .two-reports-compare {
            grid-template-columns: 1fr;
          }
          .compare-separator {
            flex-direction: row;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}
