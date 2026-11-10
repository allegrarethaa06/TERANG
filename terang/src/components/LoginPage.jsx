import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ErrorIcon() {
  return (
    <svg
      className="auth-field-error-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default function LoginPage({ onAuthenticate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    login,
    savePendingRedirect,
    consumePendingRedirect,
  } = useAuth();

  const queryRedirect = searchParams.get('redirect');

  useEffect(() => {
    if (queryRedirect) {
      savePendingRedirect(queryRedirect);
    }
  }, [queryRedirect, savePendingRedirect]);

  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const daftarPath = queryRedirect
    ? `/daftar?redirect=${encodeURIComponent(queryRedirect)}`
    : '/daftar';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Email wajib diisi.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = 'Masukkan format email yang valid (contoh: nama@email.com).';
    }

    if (!formData.password) {
      nextErrors.password = 'Kata sandi wajib diisi.';
    }

    setErrors(nextErrors);

    if (nextErrors.email && emailRef.current) {
      emailRef.current.focus();
    } else if (nextErrors.password && passwordRef.current) {
      passwordRef.current.focus();
    }

    return Object.keys(nextErrors).length === 0;
  };

  const handleForgotPassword = () => {
    setErrors({
      password: 'Lupa kata sandi? Silakan hubungi admin atau daftarkan akun baru di halaman Daftar.',
    });
    if (passwordRef.current) {
      passwordRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const actionFn = typeof onAuthenticate === 'function' ? onAuthenticate : login;
    const result = await actionFn({
      email: formData.email.trim(),
      password: formData.password,
    });

    if (result && result.ok && result.user) {
      const targetUrl = consumePendingRedirect(queryRedirect, '/dashboard');
      navigate(targetUrl, { replace: true });
      return;
    }

    if (result && result.code === 'EMAIL_NOT_FOUND') {
      setErrors({
        email: 'Email ini belum terdaftar.',
      });
      if (emailRef.current) {
        emailRef.current.focus();
      }
      return;
    }

    if (result && result.code === 'WRONG_PASSWORD') {
      setErrors({
        password: 'Kata sandi salah. Silakan coba lagi.',
      });
      if (passwordRef.current) {
        passwordRef.current.focus();
      }
      return;
    }

    if (result && result.error) {
      const targetField = result.field === 'email' ? 'email' : 'password';
      setErrors({
        [targetField]: result.error,
      });
    }
  };

  return (
    <div className="auth-page-split">
      {/* Left 45%: Worker Photo & Editorial Caption */}
      <aside className="auth-visual-panel" aria-label="Ilustrasi Penanganan Lapangan TERANG">
        {!imgError ? (
          <img
            src="/images/auth-login-worker.jpg"
            alt="Petugas lapangan dengan helm keselamatan sedang memeriksa infrastruktur jalan"
            className="auth-visual-img"
            width="768"
            height="1024"
            loading="eager"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="auth-visual-fallback" aria-hidden="true" />
        )}
        <div className="auth-visual-scrim" aria-hidden="true" />

        <div className="auth-visual-caption">
          <h2 className="auth-visual-title">
            Satu laporan, satu langkah
            <br />
            perubahan.
          </h2>
          <p className="auth-visual-subtitle">
            Mulai dari lingkungan sekitarmu.
          </p>
        </div>
      </aside>

      {/* Right 55%: Login Form */}
      <main className="auth-form-panel">
        <header className="auth-top-bar">
          <Link to="/" className="auth-logo-link" aria-label="TERANG — Kembali ke Beranda">
            {!logoError ? (
              <img
                src="/logo-terang.png"
                alt="TERANG"
                className="auth-logo-img"
                width="148"
                height="33"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="auth-logo-fallback">TERANG</span>
            )}
          </Link>

          <Link to="/" className="auth-back-link">
            <span aria-hidden="true">←</span>
            <span>Kembali ke Beranda</span>
          </Link>
        </header>

        <div className="auth-form-container">
          <div className="auth-header-block">
            <h1 className="auth-heading">Selamat datang kembali.</h1>
            <p className="auth-subheading">Masuk untuk melihat laporanmu.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className="auth-field">
              <label htmlFor="login-email" className="auth-label">
                Email
              </label>
              <div className="auth-input-wrap">
                <input
                  ref={emailRef}
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                />
              </div>
              {errors.email && (
                <span id="login-email-error" className="auth-field-error" role="alert">
                  <ErrorIcon />
                  <span>{errors.email}</span>
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="auth-field">
              <label htmlFor="login-password" className="auth-label">
                Kata sandi
              </label>
              <div className="auth-input-wrap">
                <input
                  ref={passwordRef}
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={formData.password}
                  onChange={handleChange}
                  className={`auth-input auth-input-has-toggle ${
                    errors.password ? 'auth-input-error' : ''
                  }`}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span id="login-password-error" className="auth-field-error" role="alert">
                  <ErrorIcon />
                  <span>{errors.password}</span>
                </span>
              )}
            </div>

            {/* Lupa Kata Sandi */}
            <div className="auth-forgot-row">
              <button
                type="button"
                className="auth-forgot-btn"
                onClick={handleForgotPassword}
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Primary Submit Button */}
            <button type="submit" className="auth-submit-btn">
              Masuk
            </button>

            <p className="auth-switch-text">
              Belum punya akun?
              <Link to={daftarPath} className="auth-switch-link">
                Daftar
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
