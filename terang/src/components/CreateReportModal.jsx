import { useState } from 'react';

export default function CreateReportModal({ isOpen, onClose, onReportCreated }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: 'Jalan Rusak',
    title: '',
    description: '',
    ward: 'Lebakgede',
    addressHint: '',
    safetyRiskNotice: 'Ya, berada di jalur utama dan membahayakan motor',
    hasPhoto: true,
  });
  const [submitted, setSubmitted] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  if (!isOpen) return null;

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    } else {
      const newId = `TRG-2026-${Math.floor(100 + Math.random() * 900)}`;
      setGeneratedId(newId);
      setSubmitted(true);
      if (onReportCreated) {
        onReportCreated({
          ...formData,
          id: newId,
        });
      }
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setStep(1);
    setFormData({
      category: 'Jalan Rusak',
      title: '',
      description: '',
      ward: 'Lebakgede',
      addressHint: '',
      safetyRiskNotice: 'Ya, berada di jalur utama dan membahayakan motor',
      hasPhoto: true,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} data-ui="modal">
        {/* Header */}
        <div className="create-modal-header">
          <div>
            <div className="header-tag-line">
              <span className="badge badge-simulated">Alur Pelaporan Demo</span>
              <span className="badge-region">Kecamatan Coblong, Bandung</span>
            </div>
            <h3 id="create-modal-title" className="create-title">
              {submitted ? 'Laporan Demo Berhasil Diterima' : 'Buat Laporan Kerusakan Baru'}
            </h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Tutup jendela pelaporan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper Progress */}
        {!submitted && (
          <div className="stepper-bar" data-ui="stepper">
            <div className={`stepper-step ${step >= 1 ? 'active' : ''}`}>
              <span className="step-circle">1</span>
              <span className="step-label">Informasi</span>
            </div>
            <div className="stepper-divider"></div>
            <div className={`stepper-step ${step >= 2 ? 'active' : ''}`}>
              <span className="step-circle">2</span>
              <span className="step-label">Lokasi Coblong</span>
            </div>
            <div className="stepper-divider"></div>
            <div className={`stepper-step ${step >= 3 ? 'active' : ''}`}>
              <span className="step-circle">3</span>
              <span className="step-label">Bukti Foto</span>
            </div>
            <div className="stepper-divider"></div>
            <div className={`stepper-step ${step >= 4 ? 'active' : ''}`}>
              <span className="step-circle">4</span>
              <span className="step-label">Tinjau & Kirim</span>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="create-modal-body">
          {submitted ? (
            <div className="submit-success-view">
              <div className="success-icon-badge">Selesai</div>
              <h4 className="success-headline">Laporan Telah Masuk ke Antrean Verifikasi</h4>
              <div className="success-id-box">
                <span className="id-label">Nomor Laporan Anda:</span>
                <strong className="id-number">{generatedId}</strong>
                <span className="badge badge-status-progress" style={{ marginTop: '6px' }}>Status Awal: Menunggu Verifikasi</span>
              </div>

              <div className="success-explanation">
                <p>
                  Sesuai aturan produk TERANG: Laporan Anda kini masuk antrean <strong>Human Crosscheck</strong> wilayah Coblong.
                  Verifikator akan memeriksa keabsahan bukti foto dan mencocokkan titik koordinat sebelum menetapkan rekomendasi <strong>Smart Priority</strong>.
                </p>
                <div className="demo-notice-bar">
                  <em>Mode Demo:</em> Data ini disimulasikan di peramban Anda untuk kompetisi Web In Action 2026.
                </div>
              </div>

              <div className="success-action-row">
                <button type="button" className="btn btn-primary" onClick={handleReset} style={{ width: '100%' }}>
                  Selesai dan Kembali ke Beranda
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleNext}>
              {/* STEP 1: Informasi Dasar */}
              {step === 1 && (
                <div className="form-step-content">
                  <div className="form-group">
                    <label className="form-label" htmlFor="cat-select">
                      Kategori Fasilitas Publik <span className="req">*</span>
                    </label>
                    <select
                      id="cat-select"
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Jalan Rusak">Jalan Rusak (Amblesan / Lubang Aspal / Retak)</option>
                      <option value="Drainase">Saluran Drainase (Tersumbat / Meluap / Tutup Patah)</option>
                      <option value="Penerangan Jalan">Penerangan Jalan Umum / PJU (Padam / Tiang Goyang)</option>
                    </select>
                    <span className="form-help">Pilih kategori utama yang paling sesuai dengan temuan Anda di lapangan.</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="title-input">
                      Judul Singkat Kerusakan <span className="req">*</span>
                    </label>
                    <input
                      id="title-input"
                      type="text"
                      className="form-input"
                      required
                      placeholder="Contoh: Lubang aspal dalam di depan minimarket Jl. Dipatiukur"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <span className="form-help">Beri gambaran ringkas mengenai jenis kerusakan dan patokan utama.</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="desc-input">
                      Deskripsi dan Ukuran Perkiraan <span className="req">*</span>
                    </label>
                    <textarea
                      id="desc-input"
                      className="form-input"
                      rows="3"
                      required
                      placeholder="Uraikan perkiraan lebar lubang, kedalaman, apakah tergenang air saat hujan..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              )}

              {/* STEP 2: Lokasi Coblong & Deteksi Sekitar */}
              {step === 2 && (
                <div className="form-step-content">
                  <div className="form-group">
                    <label className="form-label">
                      Kelurahan di Kecamatan Coblong <span className="req">*</span>
                    </label>
                    <select
                      className="form-input"
                      value={formData.ward}
                      onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    >
                      <option value="Lebakgede">Kelurahan Lebakgede (Area Dipatiukur, Hasanudin, Singaperbangsa)</option>
                      <option value="Sekeloa">Kelurahan Sekeloa (Area Tubagus Ismail, Sekeloa Utara)</option>
                      <option value="Dago">Kelurahan Dago (Area Ir. H. Djuanda, Cisitu, Sangkuriang)</option>
                      <option value="Lebak Siliwangi">Kelurahan Lebak Siliwangi (Area Ganesha, Siliwangi)</option>
                      <option value="Sadang Serang">Kelurahan Sadang Serang (Area Cikutra Barat, Sadang Serang)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="addr-input">
                      Alamat / Patokan Khusus di Lokasi <span className="req">*</span>
                    </label>
                    <input
                      id="addr-input"
                      type="text"
                      className="form-input"
                      required
                      placeholder="Contoh: Jl. Dipatiukur No. 50 (sebelah halte bus arah Dago)"
                      value={formData.addressHint}
                      onChange={(e) => setFormData({ ...formData, addressHint: e.target.value })}
                    />
                  </div>

                  {/* Simulated Nearby Detection Warning */}
                  <div className="nearby-detection-callout" data-ui="callout">
                    <div className="detection-head">
                      <strong>Deteksi Cerdas Radius 50 Meter</strong>
                    </div>
                    <p className="detection-body">
                      Sistem TERANG memeriksa apakah tetangga sekitar telah melaporkan masalah serupa di titik ini.
                      Ditemukan <strong>1 laporan aktif</strong> di sekitar Jl. Dipatiukur (#TRG-2026-088).
                    </p>
                    <div className="detection-choice">
                      <label className="radio-label">
                        <input type="radio" name="dupChoice" defaultChecked />
                        <span>Ini masalah berbeda dari laporan sekitar (Lanjutkan pembuatan laporan baru)</span>
                      </label>
                      <label className="radio-label">
                        <input type="radio" name="dupChoice" />
                        <span>Ini masalah yang sama (Saya ingin menambah dukungan foto ke #TRG-2026-088)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Bukti Foto & Dampak */}
              {step === 3 && (
                <div className="form-step-content">
                  <div className="form-group">
                    <label className="form-label">Unggah Bukti Foto Lapangan</label>
                    <div className="photo-upload-simulator" data-ui="uploader">
                      <img
                        src="/images/ubud-jalan-raya-pothole-2009.jpg"
                        alt="Foto bukti simulasi"
                        className="uploaded-thumb"
                        width="80"
                        height="80"
                      />
                      <div className="thumb-info">
                        <strong>bukti-kerusakan-coblong.jpg</strong>
                        <span>Ukuran: 1.2 MB · Koordinat Terpasang</span>
                        <span className="badge badge-status-verified" style={{ width: 'fit-content', marginTop: '4px' }}>
                          Foto Valid
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dampak terhadap Keselamatan Pengguna Jalan</label>
                    <select
                      className="form-input"
                      value={formData.safetyRiskNotice}
                      onChange={(e) => setFormData({ ...formData, safetyRiskNotice: e.target.value })}
                    >
                      <option value="Ya, berada di jalur utama dan membahayakan motor">
                        Tinggi: Di jalur utama angkutan kota/motor, berisiko terpelanting saat malam atau hujan
                      </option>
                      <option value="Sedang: Menghambat arus lalu lintas jalan lingkungan">
                        Sedang: Mengganggu laju kendaraan dan menggenang di depan rumah warga
                      </option>
                      <option value="Rendah: Gangguan kenyamanan jalan dan estetika trotoar">
                        Rendah: Kerusakan ringan yang tidak mengancam kecelakaan fatal
                      </option>
                    </select>
                    <span className="form-help">
                      *Keterangan: Jawaban Anda adalah masukan faktual. Level kedaruratan final ditetapkan secara objektif oleh verifikator melalui rubrik Smart Priority.
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 4: Tinjau & Kirim */}
              {step === 4 && (
                <div className="form-step-content">
                  <h4 className="review-title">Ringkasan Laporan Sebelum Dikirim:</h4>
                  <div className="review-table" data-ui="table">
                    <div className="review-row">
                      <span className="rev-lbl">Kategori:</span>
                      <strong className="rev-val">{formData.category}</strong>
                    </div>
                    <div className="review-row">
                      <span className="rev-lbl">Judul:</span>
                      <span className="rev-val">{formData.title || 'Kerusakan Jalan di Coblong'}</span>
                    </div>
                    <div className="review-row">
                      <span className="rev-lbl">Lokasi:</span>
                      <span className="rev-val">{formData.addressHint || 'Jl. Dipatiukur'}, Kel. {formData.ward}, Kec. Coblong</span>
                    </div>
                    <div className="review-row">
                      <span className="rev-lbl">Dampak Keselamatan:</span>
                      <span className="rev-val">{formData.safetyRiskNotice}</span>
                    </div>
                  </div>

                  <div className="demo-disclaimer-box">
                    <strong>Pernyataan Keterbukaan Demo:</strong>
                    <p>
                      TERANG adalah prototipe partisipasi publik mandiri untuk kompetisi Web In Action 2026.
                      Pengiriman laporan ini akan disimulasikan ke dalam antrean audit Coblong tanpa mengklaim integrasi langsung ke sistem pemerintah resmi.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="form-nav-row">
                {step > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(step - 1)}
                  >
                    ← Kembali
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginLeft: 'auto' }}
                >
                  {step === 4 ? 'Kirim Laporan (Mode Demo)' : 'Lanjutkan →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .create-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px 28px 18px;
        }
        .header-tag-line {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .badge-region {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--c-navy);
          background-color: var(--c-yellow-soft);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }
        .create-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--c-navy);
        }
        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #F1F4F9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--c-navy);
        }

        /* Stepper */
        .stepper-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 28px;
          background-color: var(--c-warm-white);
        }
        .stepper-step {
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0.45;
        }
        .stepper-step.active {
          opacity: 1;
        }
        .step-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: var(--c-navy);
          color: var(--c-white);
          font-size: 0.875rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stepper-step.active .step-circle {
          background-color: var(--c-yellow);
          color: var(--c-navy);
        }
        .step-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--c-navy);
        }
        .stepper-divider {
          height: 2px;
          flex-grow: 1;
          background-color: #CBD5E1;
          margin: 0 10px;
        }

        /* Body Form */
        .create-modal-body {
          padding: 24px 28px;
        }
        .form-group {
          margin-bottom: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--c-navy);
        }
        .req {
          color: var(--c-urgent-text);
        }
        .form-input {
          font-family: inherit;
          font-size: 1rem;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--c-border);
          background-color: var(--c-white);
          color: var(--c-navy);
          outline: none;
          transition: border-color 0.15s ease;
        }
        .form-input:focus {
          border-color: var(--c-navy);
        }
        .form-help {
          font-size: 0.875rem;
          color: var(--c-text-sec);
          line-height: 1.4;
        }
        .nearby-detection-callout {
          background-color: #FEF9EE;
          border-radius: var(--radius-md);
          padding: 14px 16px;
          margin-top: 10px;
        }
        .detection-head {
          font-size: 0.875rem;
          color: #92400E;
          margin-bottom: 6px;
        }
        .detection-body {
          font-size: 0.875rem;
          color: var(--c-navy);
          line-height: 1.45;
          margin-bottom: 10px;
        }
        .detection-choice {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .radio-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.875rem;
          color: var(--c-navy);
          cursor: pointer;
        }
        .radio-label input {
          margin-top: 3px;
        }

        /* Photo Upload */
        .photo-upload-simulator {
          display: flex;
          align-items: center;
          gap: 16px;
          background-color: var(--c-warm-white);
          border-radius: var(--radius-md);
          padding: 14px 18px;
        }
        .uploaded-thumb {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: var(--radius-sm);
        }
        .thumb-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .thumb-info strong {
          font-size: 1rem;
          color: var(--c-navy);
        }
        .thumb-info span {
          font-size: 0.875rem;
          color: var(--c-text-sec);
        }

        /* Review */
        .review-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--c-navy);
          margin-bottom: 12px;
        }
        .review-table {
          background-color: var(--c-warm-white);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 18px;
        }
        .review-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .rev-lbl {
          font-size: 0.875rem;
          color: var(--c-text-sec);
          text-transform: uppercase;
        }
        .rev-val {
          font-size: 1rem;
          color: var(--c-navy);
        }
        .demo-disclaimer-box {
          background-color: #F8FAFC;
          border-left: 3px solid var(--c-navy);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          color: var(--c-text-sec);
          line-height: 1.45;
        }

        /* Nav */
        .form-nav-row {
          display: flex;
          align-items: center;
          padding-top: 18px;
          margin-top: 10px;
        }

        /* Success View */
        .submit-success-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px 0;
        }
        .success-icon-badge {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          background-color: var(--c-yellow);
          color: var(--c-navy);
          font-size: 1rem;
          font-weight: 850;
          margin-bottom: 16px;
        }
        .success-headline {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--c-navy);
          margin-bottom: 14px;
        }
        .success-id-box {
          background-color: var(--c-warm-white);
          border-radius: var(--radius-md);
          padding: 14px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 18px;
        }
        .id-label {
          font-size: 0.8rem;
          color: var(--c-text-sec);
        }
        .id-number {
          font-size: 1.5rem;
          font-weight: 850;
          color: var(--c-navy);
          letter-spacing: -0.02em;
        }
        .success-explanation {
          max-width: 480px;
          font-size: 0.88rem;
          color: var(--c-text-sec);
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .demo-notice-bar {
          margin-top: 10px;
          background-color: #F1F4F9;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
        }
        .success-action-row {
          width: 100%;
          max-width: 320px;
        }

        @media (max-width: 640px) {
          .stepper-bar {
            padding: 10px 16px;
          }
          .step-label {
            display: none;
          }
          .create-modal-header, .create-modal-body {
            padding-left: 18px;
            padding-right: 18px;
          }
        }
      `}</style>
    </div>
  );
}
