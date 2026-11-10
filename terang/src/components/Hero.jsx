import { useState } from 'react';
import Navbar from './Navbar';

export default function Hero({
  onCreateReport,
  onAuthAction,
  onLogoClick,
}) {
  const [heroImgSrc, setHeroImgSrc] = useState('/images/hero-hd.png');
  const [heroImgError, setHeroImgError] = useState(false);

  const handleImgError = () => {
    if (heroImgSrc === '/images/hero-hd.png') {
      setHeroImgSrc('/images/hero-hd.jpg');
    } else {
      setHeroImgError(true);
    }
  };

  return (
    <section className="hero-section" id="beranda">
      <div className="hero-card-frame">
        {!heroImgError ? (
          <picture className="hero-bg-picture">
            <source srcSet="/images/hero-hd.png" type="image/png" />
            <source srcSet="/images/hero-hd.jpg" type="image/jpeg" />
            <img
              src={heroImgSrc}
              alt="Ilustrasi koridor jalan raya perkotaan untuk pelaporan infrastruktur publik TERANG"
              className="hero-bg-image"
              width="1400"
              height="820"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={handleImgError}
            />
          </picture>
        ) : (
          <div className="hero-bg-fallback" aria-hidden="true" />
        )}

        <div className="hero-bottom-fade" aria-hidden="true" />

        {/* Landing Page SELALU menggunakan navbar publik */}
        <Navbar
          isPublic={true}
          onAuthAction={onAuthAction}
          onLogoClick={onLogoClick}
        />

        <div className="hero-content-wrap">
          <h1 className="hero-heading">
            <span>Jangan cuma lapor.</span>
            <span>Kawal sampai tuntas.</span>
          </h1>

          <div className="hero-bottom-row">
            <p className="hero-subtitle">
              Laporkan kerusakan fasilitas publik, pantau proses
              penanganannya, dan kawal hasil perbaikannya.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="btn btn-primary hero-btn"
                onClick={onCreateReport}
              >
                Buat Laporan
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
