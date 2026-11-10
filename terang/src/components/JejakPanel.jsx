import { LANDING_TRANSPARENCY_CASE } from '../data/reportsData';

export default function JejakPanel({ onSelectReport, report }) {
  const handleOpenDetail = () => {
    if (onSelectReport && report) {
      onSelectReport(report);
    }
  };

  return (
    <section className="transparansi-section" id="transparansi">
      <div className="container">
        <div className="transparansi-grid">
          <div className="transparansi-copy">
            <h2 className="transparansi-title">
              Bukan cuma
              <br />
              status.
              <br />
              Ada alasan di
              <br />
              baliknya.
            </h2>
            <p className="transparansi-subtitle">
              Lihat kenapa sebuah laporan didahulukan.
            </p>
          </div>

          <div
            className="jejak-card"
            onClick={handleOpenDetail}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenDetail();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Lihat detail Jejak Keputusan laporan TRG-024"
          >
            <div className="jejak-card-top">
              <h3 className="jejak-card-heading">Jejak Keputusan</h3>
              <span className="jejak-sim-pill">
                {LANDING_TRANSPARENCY_CASE.badgeText}
              </span>
            </div>

            <div className="jejak-divider" />

            <div className="jejak-priority-body">
              <div className="jejak-priority-line">
                <span className="jejak-priority-prefix">Prioritas:</span>
                <span className="jejak-urgent-pill">
                  {LANDING_TRANSPARENCY_CASE.priority}
                </span>
              </div>
              <p className="jejak-reason-main">
                {LANDING_TRANSPARENCY_CASE.reason}
              </p>
              <p className="jejak-reason-sub">
                {LANDING_TRANSPARENCY_CASE.verifiedMeta}
              </p>
            </div>

            <div className="jejak-divider" />

            <div className="jejak-budget-footer">
              <span className="jejak-budget-label">
                {LANDING_TRANSPARENCY_CASE.budgetLabel}
              </span>
              <span className="jejak-budget-value">
                {LANDING_TRANSPARENCY_CASE.budgetStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
