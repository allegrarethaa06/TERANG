import { useState } from 'react';
import { LANDING_STEPS } from '../data/reportsData';

export default function CaraKerja() {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <section className="cara-kerja-section" id="cara-kerja">
      <div className="container">
        <div className="cara-kerja-header">
          <h2 className="cara-kerja-title">
            Setelah lapor,
            <br />
            apa selanjutnya?
          </h2>
          <p className="cara-kerja-lead">
            Lihat bagaimana laporanmu diterima, diperiksa
            <br />
            sampai hasilnya bisa dipantau.
          </p>
        </div>

        <div className="cara-kerja-grid">
          {LANDING_STEPS.map((step, idx) => {
            const isActive = activeIndex === idx;
            return (
              <article
                key={step.number}
                className={`cara-kerja-card ${isActive ? 'cara-kerja-card-active' : ''}`}
                tabIndex={0}
                role="button"
                aria-pressed={isActive}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(idx)}
                onBlur={() => setActiveIndex(null)}
                onClick={() => setActiveIndex((prev) => (prev === idx ? null : idx))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveIndex((prev) => (prev === idx ? null : idx));
                  }
                }}
              >
                <div
                  className="cara-kerja-step-num"
                  aria-label={`Langkah ${step.number} dari ${step.total}`}
                >
                  <span className="step-num-main">{step.number}</span>
                  <span className="step-num-total">/ {step.total}</span>
                </div>

                <div className="cara-kerja-card-body">
                  <h3 className="cara-kerja-card-title">{step.title}</h3>
                  <p className="cara-kerja-card-desc">{step.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
