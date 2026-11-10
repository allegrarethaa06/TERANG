import { useState, useRef, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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

function evaluatePasswordStrength(pw) {
  if (!pw) {
    return { level: 0, label: '', cssClass: '', badgeClass: '' };
  }
  if (pw.length < 8) {
    return {
      level: 1,
      label: 'Lemah',
      cssClass: 'level-weak',
      badgeClass: 'pw-badge-weak',
    };
  }

  let variety = 0;
  if (/[a-z]/.test(pw)) variety += 1;
  if (/[A-Z]/.test(pw)) variety += 1;
  if (/[0-9]/.test(pw)) variety += 1;
  if (/[^A-Za-z0-9]/.test(pw)) variety += 1;

  if ((pw.length >= 10 && variety >= 2) || variety >= 3) {
    return {
      level: 3,
      label: 'Kuat',
      cssClass: 'level-strong',
      badgeClass: 'pw-badge-strong',
    };
  }

  if (variety >= 2 || pw.length >= 9) {
    return {
      level: 2,
      label: 'Cukup',
      cssClass: 'level-fair',
      badgeClass: 'pw-badge-fair',
    };
  }

  return {
    level: 1,
    label: 'Lemah',
    cssClass: 'level-weak',
    badgeClass: 'pw-badge-weak',
  };
}

export default function RegisterPage({ onRegister }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, savePendingRedirect, consumePendingRedirect } = useAuth();

  const queryRedirect = searchParams.get('redirect');

  useEffect(() => {
    if (queryRedirect) {
      savePendingRedirect(queryRedirect);
    }
  }, [queryRedirect, savePendingRedirect]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const masukPath = queryRedirect
    ? `/masuk?redirect=${encodeURIComponent(queryRedirect)}`
    : '/masuk';

  const strength = useMemo(
    () => evaluatePasswordStrength(formData.password),
    [formData.password]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      return updated;
    });

    setErrors((prev) => {
      const next = { ...prev };
      if (next[name]) {
        delete next[name];
      }
      if (
        (name === 'password' || name === 'confirmPassword') &&
        next.confirmPassword
      ) {
        const nextPw = name === 'password' ? value : formData.password;
        const nextConfirm =
          name === 'confirmPassword' ? value : formData.confirmPassword;
        if (nextConfirm && nextPw === nextConfirm) {
          delete next.confirmPassword;
        }
      }
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedName = formData.fullName.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      nextErrors.fullName = 'Nama lengkap wajib diisi.';
    } else if (trimmedName.length < 2) {
      nextErrors.fullName = 'Nama lengkap minimal terdiri dari 2 karakter.';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email wajib diisi.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = 'Masukkan format email yang valid (contoh: nama@email.com).';
    }

    if (!formData.password) {
      nextErrors.password = 'Kata sandi wajib diisi.';
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Kata sandi minimal terdiri dari 8 karakter.';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Konfirmasi kata sandi wajib diisi.';
    } else if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok dengan kata sandi.';
    }

    setErrors(nextErrors);

    if (nextErrors.fullName && nameRef.current) {
      nameRef.current.focus();
    } else if (nextErrors.email && emailRef.current) {
      emailRef.current.focus();
    } else if (nextErrors.password && passwordRef.current) {
      passwordRef.current.focus();
    } else if (nextErrors.confirmPassword && confirmRef.current) {
      confirmRef.current.focus();
    }

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const actionFn = typeof onRegister === 'function' ? onRegister : register;
    const result = await actionFn({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password,
    });

    if (result && result.ok && result.user) {
      // Daftar berhasil -> langsung Dashboard
      consumePendingRedirect();
      navigate('/dashboard', { replace: true });
      return;
    }

    if (result && result.error) {
      const targetField = result.field || 'email';
      setErrors((prev) => ({
        ...prev,
        [targetField]: result.error,
      }));
    }
  };

  const confirmMismatchLive =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword &&
    !errors.confirmPassword;

  return (
    <div className="auth-page-split auth-page-register">
      {/* Left 45%: Drainage Photo & Editorial Caption */}
      <aside className="auth-visual-panel" aria-label="Ilustrasi Infrastruktur Drainase TERANG">
        {!imgError ? (
          <img
            src="/images/auth-register-drainage.jpg"
            alt="Saluran drainase jalan di lingkungan warga"
            className="auth-visual-img auth-visual-img-register"
            width="755"
            height="1024"
            loading="eager"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="auth-visual-fallback" aria-hidden="true" />
        )}
        <div className="auth-visual-scrim" aria-hidden="true" />

        <div className="auth-visual-caption">
          <h2 className="auth-visual-title">Mulai dari sekitarmu.</h2>
          <p className="auth-visual-subtitle">
            Bersama TERANG, setiap laporan punya arti.
          </p>
        </div>
      </aside>

      {/* Right 55%: Registration Form */}
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
            <h1 className="auth-heading">Buat akun TERANG.</h1>
            <p className="auth-subheading">
              Daftar untuk mulai melapor dan memantau perkembangannya.
            </p>

            {searchParams.get('redirect') === '/buat-laporan' && (
              <div className="auth-redirect-notice" role="status">
                Setelah pendaftaran berhasil, Anda akan langsung diarahkan ke halaman{' '}
                <strong>Buat Laporan</strong> (<code>/buat-laporan</code>).
              </div>
            )}
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Nama Lengkap */}
            <div className="auth-field">
              <label htmlFor="register-fullname" className="auth-label">
                Nama lengkap
              </label>
              <div className="auth-input-wrap">
                <input
                  ref={nameRef}
                  id="register-fullname"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Masukkan nama lengkap"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`auth-input ${errors.fullName ? 'auth-input-error' : ''}`}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? 'register-fullname-error' : undefined}
                />
              </div>
              {errors.fullName && (
                <span id="register-fullname-error" className="auth-field-error" role="alert">
                  <ErrorIcon />
                  <span>{errors.fullName}</span>
                </span>
              )}
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="register-email" className="auth-label">
                Email
              </label>
              <div className="auth-input-wrap">
                <input
                  ref={emailRef}
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'register-email-error' : undefined}
                />
              </div>
              {errors.email && (
                <span id="register-email-error" className="auth-field-error" role="alert">
                  <ErrorIcon />
                  <span>{errors.email}</span>
                </span>
              )}
            </div>

            {/* Kata Sandi + Strength Indicator */}
            <div className="auth-field">
              <label htmlFor="register-password" className="auth-label">
                Kata sandi
              </label>
              <div className="auth-input-wrap">
                <input
                  ref={passwordRef}
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Buat kata sandi"
                  value={formData.password}
                  onChange={handleChange}
                  className={`auth-input auth-input-has-toggle ${
                    errors.password ? 'auth-input-error' : ''
                  }`}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="register-password-hint"
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
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>

              {/* 3-Bar Interactive Password Strength Indicator */}
              <div className="pw-strength-wrap" id="register-password-hint">
                <div className="pw-strength-bars" aria-hidden="true">
                  {[1, 2, 3].map((segment) => (
                    <span
                      key={segment}
                      className={`pw-strength-bar ${
                        strength.level >= segment ? strength.cssClass : ''
                      }`}
                    />
                  ))}
                </div>
                <div className="pw-strength-meta">
                  <span className="pw-strength-hint">
                    Minimal 8 karakter. Semakin panjang dan sulit ditebak, semakin baik.
                  </span>
                  {strength.level > 0 && (
                    <span
                      className={`pw-strength-badge ${strength.badgeClass}`}
                      aria-live="polite"
                    >
                      {strength.label}
                    </span>
                  )}
                </div>
              </div>

              {errors.password && (
                <span className="auth-field-error" role="alert">
                  <ErrorIcon />
                  <span>{errors.password}</span>
                </span>
              )}
            </div>

            {/* Konfirmasi Kata Sandi */}
            <div className="auth-field">
              <label htmlFor="register-confirm-password" className="auth-label">
                Konfirmasi kata sandi
              </label>
              <div className="auth-input-wrap">
                <input
                  ref={confirmRef}
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Ulangi kata sandi"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`auth-input auth-input-has-toggle ${
                    errors.confirmPassword || confirmMismatchLive ? 'auth-input-error' : ''
                  }`}
                  aria-invalid={Boolean(errors.confirmPassword || confirmMismatchLive)}
                  aria-describedby={
                    errors.confirmPassword || confirmMismatchLive
                      ? 'register-confirm-error'
                      : undefined
                  }
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? 'Sembunyikan konfirmasi kata sandi'
                      : 'Tampilkan konfirmasi kata sandi'
                  }
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
              {(errors.confirmPassword || confirmMismatchLive) && (
                <span id="register-confirm-error" className="auth-field-error" role="alert">
                  <ErrorIcon />
                  <span>
                    {errors.confirmPassword || 'Konfirmasi kata sandi belum cocok dengan kata sandi.'}
                  </span>
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" className="auth-submit-btn">
              Buat Akun
            </button>

            <p className="auth-switch-text">
              Sudah punya akun?
              <Link to={masukPath} className="auth-switch-link">
                Masuk
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
