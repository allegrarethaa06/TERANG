import { useState } from 'react';

const FOOTER_NAV = [
  { key: 'cara-kerja', label: 'Cara Kerja', href: '#cara-kerja' },
  { key: 'peta-laporan', label: 'Peta Laporan', href: '#peta-laporan' },
  { key: 'transparansi', label: 'Transparansi', href: '#transparansi' },
];

export default function Footer({ onLogoClick }) {
  const [wordmarkError, setWordmarkError] = useState(false);

  const handleFooterNav = (e, item) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    const target = document.querySelector(item.href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBrandClick = (e) => {
    e.preventDefault();
    if (onLogoClick) {
      onLogoClick();
    } else {
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="landing-footer">
      <div className="container">
        <div className="footer-top-grid">
          <div className="footer-cta-col">
            <h2 className="footer-headline">
              <span className="footer-headline-white">Setiap laporan punya</span>
              <br />
              <span className="footer-headline-yellow">arti.</span>
            </h2>
            <p className="footer-subtext">
              Suarakan masalah di sekitarmu, pantau prosesnya, dan
              <br />
              pastikan setiap laporan mendapat perhatian.
            </p>
          </div>

          <nav className="footer-nav-col" aria-label="Navigasi Footer Publik">
            <span className="footer-nav-label">NAVIGASI</span>
            <ul className="footer-nav-list">
              {FOOTER_NAV.map((item) => (
                <li key={item.key} className="footer-nav-item">
                  <a
                    href={item.href}
                    className="footer-nav-link"
                    onClick={(e) => handleFooterNav(e, item)}
                  >
                    <span className="footer-nav-text">{item.label}</span>
                    <span className="footer-arrow-circle" aria-hidden="true">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="footer-wordmark-wrap">
          <a
            href="/"
            className="footer-wordmark-link"
            onClick={handleBrandClick}
            aria-label="TERANG — Kembali ke Landing Page"
          >
            {!wordmarkError ? (
              <img
                src="/logo-terang-white.png"
                alt="TERANG"
                className="footer-wordmark-img"
                width="1494"
                height="336"
                loading="lazy"
                onError={() => setWordmarkError(true)}
              />
            ) : (
              <span className="footer-wordmark-fallback">TERANG</span>
            )}
          </a>
        </div>

        <div className="footer-bottom-bar">
          <p className="footer-disclaimer">
            Website demo untuk lomba. Bukan layanan pengaduan resmi pemerintah. Data laporan hanya
            <br />
            simulasi.
          </p>

          <div className="footer-copyright">
            <span className="footer-tagline">Lapor. Kawal. Tuntas.</span>
            <span className="footer-sep" aria-hidden="true">•</span>
            <span className="footer-year">© 2025 TERANG</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
