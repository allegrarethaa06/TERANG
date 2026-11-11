import { useState, useEffect } from 'react';

export default function ReportDetailModal({ report, onClose }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [citizenVote, setCitizenVote] = useState(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!report) return null;

  const handleVote = (type) => {
    setCitizenVote(type);
    setVoteSubmitted(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-report-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} data-ui="modal">
        {/* Modal Top Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-badge-row">
              <span className="modal-id">{report.id}</span>
              <span className="badge badge-simulated">Data Simulasi Demo</span>
              <span className={`badge ${
                report.urgency === 'Most Urgent' ? 'badge-urgent-most' :
                report.urgency === 'Urgent' ? 'badge-urgent' : 'badge-not-urgent'
              }`}>
                {report.urgency}
              </span>
            </div>
            <h3 id="modal-report-title" className="modal-title">{report.title}</h3>
            <p className="modal-sub">
              {report.address}, Kelurahan {report.ward}, Kecamatan {report.subdistrict}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup jendela rincian laporan"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Bukti & Deskripsi
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'decisions' ? 'active' : ''}`}
            onClick={() => setActiveTab('decisions')}
          >
            Jejak Keputusan ({report.decisionTrail?.length || 0})
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'radar' ? 'active' : ''}`}
            onClick={() => setActiveTab('radar')}
          >
            Radar Kerusakan
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            Anggaran & Konfirmasi
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="modal-body">
          {/* Tab 1: Bukti & Deskripsi */}
          {activeTab === 'summary' && (
            <div className="tab-pane">
              <div className="photos-row">
                <div className="photo-box">
                  <span className="photo-label">Bukti Foto Kerusakan Awal</span>
                  <div className="photo-frame">
                    <img src={report.photoUrl} alt="Foto kondisi kerusakan" className="modal-img" width="1920" height="1440" />
                  </div>
                  <span className="photo-sub">Tanggal Lapor: {report.reportedAt}</span>
                </div>

                {report.repairPhotoUrl && (
                  <div className="photo-box">
                    <span className="photo-label">Bukti Perkembangan Penanganan</span>
                    <div className="photo-frame">
                      <img src={report.repairPhotoUrl} alt="Foto penanganan lapangan" className="modal-img" width="1920" height="1294" />
                    </div>
                    <span className="photo-sub">Dokumentasi Unit Lapangan Coblong</span>
                  </div>
                )}
              </div>

              <div className="detail-meta-box">
                <h4 className="meta-block-title">Uraian Lapangan dan Dampak Keselamatan:</h4>
                <p className="detail-desc-text">{report.description}</p>
                <div className="impact-box">
                  <strong>Analisis Dampak Keselamatan:</strong>
                  <p>{report.safetyImpact}</p>
                </div>
                <div className="impact-box" style={{ marginTop: '10px', backgroundColor: '#F8FAFC' }}>
                  <strong>Alasan Penetapan Urgensi ({report.urgency}):</strong>
                  <p>{report.urgencyReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Jejak Keputusan (Audit Trail) */}
          {activeTab === 'decisions' && (
            <div className="tab-pane">
              <div className="audit-lead-text">
                <p>
                  Catatan kronologis seluruh tindakan verifikator dan petugas yang bertugas di Kecamatan Coblong.
                  Data tidak dapat disunting atau dihapus secara sepihak.
                </p>
              </div>

              <div className="modal-decision-timeline">
                {report.decisionTrail?.map((trail) => (
                  <div key={trail.step} className="modal-timeline-item">
                    <div className="modal-timeline-step-badge">{trail.step}</div>
                    <div className="modal-timeline-info">
                      <div className="modal-timeline-top">
                        <span className="timeline-actor-name">{trail.actor}</span>
                        <span className="timeline-time-val">{trail.time}</span>
                      </div>
                      <h5 className="timeline-action-name">{trail.action}</h5>
                      <span className="badge badge-status-progress" style={{ width: 'fit-content', marginBottom: '8px' }}>
                        Status: {trail.status}
                      </span>
                      <div className="timeline-note-bubble">
                        <strong>Catatan Alasan Keputusan:</strong>
                        <p>{trail.note}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Radar Kerusakan */}
          {activeTab === 'radar' && (
            <div className="tab-pane">
              <div className="radar-modal-panel">
                <div className="radar-status-head">
                  <span className="badge badge-urgent-most">Status Radar</span>
                  <h4>{report.radarStatus}</h4>
                </div>

                {report.radarDetails?.isRecurring ? (
                  <div className="recurring-details-box">
                    <div className="recurring-item-row">
                      <span className="rec-lbl">Tautan Laporan Riwayat Terdahulu</span>
                      <strong className="rec-val">#{report.radarDetails.linkedReportId}</strong>
                    </div>
                    <div className="recurring-item-row">
                      <span className="rec-lbl">Tanggal Perbaikan Terakhir</span>
                      <span className="rec-val">{report.radarDetails.previousFixDate}</span>
                    </div>
                    <div className="recurring-item-row">
                      <span className="rec-lbl">Jarak Waktu Antar-Kerusakan</span>
                      <span className="rec-val" style={{ color: '#B91C1C', fontWeight: '700' }}>
                        {report.radarDetails.intervalDays} Hari
                      </span>
                    </div>
                    <div className="recurring-item-row">
                      <span className="rec-lbl">Hipotesis Akar Masalah Teknis</span>
                      <p className="rec-val-desc">{report.radarDetails.rootCauseHypothesis}</p>
                    </div>

                    <div className="radar-advice-callout">
                      <strong>Rekomendasi Tindak Lanjut TERANG:</strong>
                      <p>
                        Dinas terkait tidak diperbolehkan hanya melakukan penambalan aspal permukaan.
                        Wajib dilakukan pembongkaran pondasi dan perbaikan rembesan drainase sebelum penutupan status.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="non-recurring-box">
                    <p>
                      Tidak terdeteksi riwayat penanganan di koordinat ini dalam 12 bulan terakhir.
                      Laporan diklasifikasikan sebagai insiden baru pertama.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Anggaran & Konfirmasi Warga */}
          {activeTab === 'budget' && (
            <div className="tab-pane">
              {/* Budget Section */}
              <div className="modal-budget-card">
                <h4 className="sub-title">Transparansi Sumber Anggaran Publik</h4>
                <div className="budget-meta-list">
                  <div>
                    <span className="b-lbl">Paket Pengadaan:</span>
                    <strong className="b-val">{report.budgetTrail?.packageName}</strong>
                  </div>
                  <div>
                    <span className="b-lbl">Instansi Pengampu:</span>
                    <span className="b-val">{report.budgetTrail?.agency} ({report.budgetTrail?.fiscalYear})</span>
                  </div>
                  <div>
                    <span className="b-lbl">Status Verifikasi Hubungan:</span>
                    <span className="badge badge-status-verified">{report.budgetTrail?.linkageStatus}</span>
                  </div>
                </div>
                <p className="budget-note-p">
                  Catatan Integritas: {report.budgetTrail?.disclaimer}
                </p>
              </div>

              {/* Citizen Confirmation Section */}
              <div className="citizen-confirm-card">
                <h4 className="sub-title">Konfirmasi Kondisi Lapangan oleh Warga Sekitar</h4>
                <p className="confirm-desc">
                  Apakah kondisi kerusakan di lokasi ini benar-benar telah diperbaiki dengan baik?
                  Suara warga menjadi instrumen akuntabilitas sebelum status resmi dapat ditutup sebagai "Selesai".
                </p>

                {voteSubmitted ? (
                  <div className="vote-success-box">
                    <strong>Konfirmasi mode demo Anda telah tercatat.</strong>
                    <p>
                      Pilihan Anda: <strong>{citizenVote === 'repaired' ? 'Sudah Diperbaiki' : 'Masih Rusak'}</strong>.
                      Dalam sistem TERANG, tanggapan warga masuk ke antrean verifikasi lapangan verifikator.
                    </p>
                  </div>
                ) : (
                  <div className="vote-actions">
                    <button
                      type="button"
                      className="btn btn-secondary vote-btn"
                      onClick={() => handleVote('still-broken')}
                    >
                      Di Lapangan Masih Rusak
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary vote-btn"
                      onClick={() => handleVote('repaired')}
                    >
                      Sudah Diperbaiki dan Mulus
                    </button>
                  </div>
                )}

                <div className="votes-tally">
                  <span>Simulasi Suara Warga:</span>
                  <span><strong>{report.citizenConfirmation?.votes.repaired || 14}</strong> Menyatakan Selesai</span>
                  <span>·</span>
                  <span><strong>{report.citizenConfirmation?.votes.stillBroken || 4}</strong> Menyatakan Masih Rusak</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span className="footer-disclaimer-text">
            Kecamatan Coblong Pilot Sandbox, Prototipe Web In Action 2026
          </span>
        </div>
      </div>

      <style>{`
        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px 28px 18px;
          position: sticky;
          top: 0;
          background-color: var(--c-white);
          z-index: 10;
        }
        .modal-title-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .modal-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .modal-id {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--c-navy);
          background-color: #EEF2F6;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }
        .modal-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--c-navy);
          line-height: 1.25;
        }
        .modal-sub {
          font-size: 0.875rem;
          color: var(--c-text-sec);
        }
        .modal-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--c-navy);
          background-color: #F1F4F9;
          transition: background-color 0.15s ease;
          flex-shrink: 0;
        }
        .modal-close-btn:hover {
          background-color: #E2E8F0;
        }

        /* Tabs */
        .modal-tabs {
          display: flex;
          background-color: var(--c-warm-white);
          overflow-x: auto;
        }
        .modal-tab-btn {
          padding: 12px 20px;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--c-text-sec);
          border-bottom: 3px solid transparent;
          transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
          white-space: nowrap;
        }
        .modal-tab-btn:hover {
          color: var(--c-navy);
        }
        .modal-tab-btn.active {
          color: var(--c-navy);
          background-color: var(--c-white);
          border-bottom-color: var(--c-yellow);
        }

        /* Body */
        .modal-body {
          padding: 24px 28px;
        }
        .photos-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 24px;
        }
        .photo-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .photo-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--c-navy);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .photo-frame {
          width: 100%;
          height: 200px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background-color: #E2E8F0;
        }
        .modal-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .photo-sub {
          font-size: 0.875rem;
          color: var(--c-text-sec);
        }
        .detail-meta-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .meta-block-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--c-navy);
        }
        .detail-desc-text {
          font-size: 1rem;
          color: var(--c-navy);
          line-height: 1.55;
        }
        .impact-box {
          background-color: var(--c-warm-white);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
        }
        .impact-box strong {
          display: block;
          font-size: 0.875rem;
          color: var(--c-navy);
          margin-bottom: 2px;
        }
        .impact-box p {
          font-size: 1rem;
          color: var(--c-text-sec);
          line-height: 1.45;
        }

        /* Tab 2 Timeline */
        .audit-lead-text {
          margin-bottom: 20px;
        }
        .audit-lead-text p {
          font-size: 0.88rem;
          color: var(--c-text-sec);
        }
        .modal-decision-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .modal-timeline-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding-bottom: 16px;
        }
        .modal-timeline-step-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: var(--c-navy);
          color: var(--c-yellow);
          font-size: 0.8rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .modal-timeline-info {
          flex-grow: 1;
        }
        .modal-timeline-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .timeline-actor-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--c-navy);
        }
        .timeline-time-val {
          font-size: 0.875rem;
          color: var(--c-text-sec);
        }
        .timeline-action-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--c-navy);
          margin-bottom: 6px;
        }
        .timeline-note-bubble {
          background-color: #F8FAFC;
          border-left: 3px solid var(--c-teal);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
        }
        .timeline-note-bubble strong {
          display: block;
          font-size: 0.875rem;
          color: var(--c-navy);
          margin-bottom: 2px;
        }
        .timeline-note-bubble p {
          font-size: 1rem;
          color: var(--c-navy);
          line-height: 1.45;
        }

        /* Tab 3 Radar */
        .radar-modal-panel {
          background-color: var(--c-warm-white);
          border-radius: var(--radius-md);
          padding: 20px;
        }
        .radar-status-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .radar-status-head h4 {
          font-size: 1.05rem;
          color: var(--c-navy);
        }
        .recurring-details-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .recurring-item-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .rec-lbl {
          font-size: 0.875rem;
          color: var(--c-text-sec);
          text-transform: uppercase;
        }
        .rec-val {
          font-size: 0.95rem;
          color: var(--c-navy);
        }
        .rec-val-desc {
          font-size: 0.88rem;
          color: var(--c-navy);
          line-height: 1.5;
        }
        .radar-advice-callout {
          background-color: #FEF2F2;
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          margin-top: 10px;
        }
        .radar-advice-callout strong {
          display: block;
          font-size: 0.875rem;
          color: #991B1B;
          margin-bottom: 4px;
        }
        .radar-advice-callout p {
          font-size: 0.875rem;
          color: #7F1D1D;
          line-height: 1.45;
        }

        /* Tab 4 Budget & Confirm */
        .modal-budget-card {
          background-color: var(--c-warm-white);
          border-radius: var(--radius-md);
          padding: 18px;
          margin-bottom: 24px;
        }
        .sub-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--c-navy);
          margin-bottom: 12px;
        }
        .budget-meta-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }
        .b-lbl {
          font-size: 0.875rem;
          color: var(--c-text-sec);
          margin-right: 6px;
        }
        .b-val {
          font-size: 1rem;
          color: var(--c-navy);
        }
        .budget-note-p {
          font-size: 0.875rem;
          color: var(--c-text-sec);
          line-height: 1.45;
        }
        .citizen-confirm-card {
          background-color: #F8FAFC;
          border-radius: var(--radius-md);
          padding: 20px;
        }
        .confirm-desc {
          font-size: 1rem;
          color: var(--c-navy);
          line-height: 1.5;
          margin-bottom: 16px;
        }
        .vote-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .vote-btn {
          flex: 1;
          font-size: 0.875rem;
          padding: 10px 16px;
        }
        .vote-success-box {
          background-color: #EEF8F3;
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          margin-bottom: 16px;
        }
        .vote-success-box strong {
          display: block;
          font-size: 0.875rem;
          color: var(--c-success-text);
          margin-bottom: 4px;
        }
        .vote-success-box p {
          font-size: 1rem;
          color: var(--c-navy);
          line-height: 1.45;
        }
        .votes-tally {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: var(--c-text-sec);
          flex-wrap: wrap;
        }

        /* Modal Footer */
        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 16px 28px 22px;
          background-color: var(--c-white);
          border-top: 1px solid #EAEAF2;
        }
        .footer-disclaimer-text {
          font-size: 0.875rem;
          color: var(--c-text-sec);
        }

        @media (max-width: 640px) {
          .photos-row {
            grid-template-columns: 1fr;
          }
          .vote-actions {
            flex-direction: column;
          }
          .modal-header, .modal-body, .modal-footer {
            padding-left: 18px;
            padding-right: 18px;
          }
        }
      `}</style>
    </div>
  );
}
