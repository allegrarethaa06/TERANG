import { useState } from 'react';
import { LANDING_RADAR_CASE } from '../data/reportsData';

export default function RadarRusakLagi({ onSelectReport, report }) {
  const [bgError, setBgError] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  const handleInspectCase = () => {
    if (onSelectReport && report) {
      onSelectReport(report);
    }
  };

  return (
    <section className="radar-section" id="peta-laporan">
      <div className="container">
        <div className="radar-photo-frame">
          {!bgError ? (
            <img
              src={LANDING_RADAR_CASE.bgImage}
              alt="Kondisi jalan lingkungan dengan riwayat perbaikan aspal"
              className="radar-bg-img"
              width="1024"
              height="506"
              loading="lazy"
              onError={() => setBgError(true)}
            />
          ) : (
            <div className="radar-bg-fallback" aria-hidden="true" />
          )}

          <div
            className="radar-overlay-card"
            onClick={handleInspectCase}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInspectCase();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Lihat detail laporan berulang TRG-024"
          >
            <div className="radar-col-title">
              <h2 className="radar-card-heading">
                Sudah diperbaiki.
                <br />
                Rusak lagi?
              </h2>
            </div>

            <div className="radar-col-thumb">
              {!thumbError ? (
                <img
                  src={LANDING_RADAR_CASE.thumbImage}
                  alt="Permukaan jalan berlubang kembali di titik tambalan lama"
                  className="radar-thumb-img"
                  width="466"
                  height="258"
                  loading="lazy"
                  onError={() => setThumbError(true)}
                />
              ) : (
                <div className="radar-thumb-fallback" role="img" aria-label="Pratinjau foto jalan rusak">
                  <span>Foto bukti laporan TRG-024</span>
                </div>
              )}
            </div>

            <div className="radar-col-meta">
              <div className="radar-meta-group">
                <span className="radar-meta-label">SEBELUMNYA</span>
                <div className="radar-meta-value-line">
                  <strong className="radar-id">{LANDING_RADAR_CASE.previousId}</strong>
                  <span className="radar-state radar-state-done">
                    {LANDING_RADAR_CASE.previousStatus}
                  </span>
                </div>
              </div>

              <div className="radar-meta-group">
                <span className="radar-meta-label">LAPORAN BARU</span>
                <div className="radar-meta-value-line">
                  <strong className="radar-id">{LANDING_RADAR_CASE.newId}</strong>
                  <span className="radar-state radar-state-pending">
                    {LANDING_RADAR_CASE.newStatus}
                  </span>
                </div>
              </div>

              <p className="radar-meta-note">{LANDING_RADAR_CASE.note}</p>
            </div>
          </div>

          <span className="radar-photo-badge">{LANDING_RADAR_CASE.badgeText}</span>
        </div>
      </div>
    </section>
  );
}
