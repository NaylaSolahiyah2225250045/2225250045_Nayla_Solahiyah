import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import MascotLive from '../components/MascotLive.jsx';
import { Logo } from '../components/Mascot.jsx';
import { IconArrowLeft, IconArrowRight } from '../components/NavIcons.jsx';
import { MASCOT_LINES } from '../content/messages.js';
import { KELAS, login, register, registerTeacher, useSession } from '../lib/account.js';
import { getServer, setServer } from '../lib/api.js';
import SkyFx from '../components/SkyFx.jsx';
import AudioControl from '../components/AudioControl.jsx';

const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

function Field({ id, label, error, hint, children }) {
  return (
    <div className={`form-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="form-field__error" id={`${id}-err`} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p className="form-field__hint" id={`${id}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function PasswordInput({ id, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input
        id={id}
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <button type="button" className="input-wrap__btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
        <EyeIcon off={show} />
      </button>
    </div>
  );
}

/** Tujuan setelah masuk: Dashboard Guru untuk akun guru, Dashboard Siswa (Beranda) untuk siswa. */
export const homeFor = (profile) => (profile?.role === 'teacher' ? '/guru' : '/beranda');

/** Pengaturan alamat server sekolah (opsional). Tanpa server: mode lokal di perangkat ini. */
function ServerSetting() {
  const [value, setValue] = useState(() => getServer().replace(/\/api\/v1$/, ''));
  const [saved, setSaved] = useState(false);
  const current = getServer();
  return (
    <details className="server-setting">
      <summary className="small">{current ? 'Terhubung ke server sekolah' : 'Mode lokal (tanpa server sekolah)'} · ubah</summary>
      <form
        className="server-setting__form"
        onSubmit={(e) => {
          e.preventDefault();
          setServer(value.trim() ? value : '');
          setSaved(true);
        }}
      >
        <label htmlFor="f-server" className="small">
          Alamat server sekolah (dari guru/admin)
        </label>
        <div className="row">
          <input
            id="f-server"
            className="input"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            placeholder="mis. https://nobaku.sekolah.sch.id"
            autoCapitalize="none"
            spellCheck={false}
          />
          <button type="submit" className="btn btn--sm">
            Simpan
          </button>
        </div>
        <p className="small muted">{saved ? 'Tersimpan.' : 'Kosongkan untuk memakai mode lokal: akun & kelas hanya ada di perangkat ini.'}</p>
      </form>
    </details>
  );
}

/** Halaman Masuk / Daftar. Daftar: pilih jenis akun Siswa atau Guru. Masuk: jenis akun dikenali otomatis. */
export default function AuthPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'daftar' ? 'daftar' : 'masuk';
  const role = params.get('peran') === 'guru' ? 'guru' : 'siswa';
  const asTeacher = mode === 'daftar' && role === 'guru';
  const [form, setForm] = useState({ name: '', username: '', password: '', confirm: '', login: '', school: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const submitting = useRef(false);

  if (session && !success && !submitting.current) return <Navigate to={homeFor(session)} replace />;

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const switchMode = (m) => {
    setErrors({});
    setParams(m === 'daftar' ? { mode: 'daftar', ...(role === 'guru' ? { peran: 'guru' } : {}) } : {}, { replace: true });
  };
  const switchRole = (r) => {
    setErrors({});
    setParams(r === 'guru' ? { mode: 'daftar', peran: 'guru' } : { mode: 'daftar' }, { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    submitting.current = true;
    const res = mode === 'masuk' ? await login(form.username, form.password) : asTeacher ? await registerTeacher(form) : await register(form);
    setBusy(false);
    if (!res.ok) {
      submitting.current = false;
      setErrors(res.errors);
      return;
    }
    setSuccess(true);
    // Beri waktu maskot merayakan sebentar, lalu ke Dashboard.
    setTimeout(() => navigate(homeFor(res.profile), { replace: true }), 650);
  };

  const hasError = Object.values(errors).some(Boolean);
  const lines = success ? [`Yeay! Halo, ${session?.name ?? 'kamu'}!`] : hasError ? MASCOT_LINES.authError : mode === 'daftar' ? MASCOT_LINES.register : MASCOT_LINES.login;

  return (
    <div className="auth-screen">
      <aside className="auth-art">
        <SkyFx tone="light" />
        <Link to="/" className="auth-art__back" aria-label="Kembali ke halaman sambutan">
          <IconArrowLeft />
        </Link>
        <Logo size={50} />
        <div className="auth-art__audio">
          <AudioControl light />
        </div>
        <div className="auth-art__stage">
          <MascotLive
            key={success ? 'yay' : hasError ? 'err' : mode}
            poses={success ? ['happy', 'jump'] : hasError ? ['surprised', 'think'] : mode === 'daftar' ? ['wave', 'smile', 'wink'] : ['thumb', 'wink', 'smile']}
            size={170} lines={lines} bubble="top" celebrate={success} />
        </div>
        <ul className="auth-art__perks">
          <li>Belajar bertahap, satu konsep per layar</li>
          <li>Petunjuk muncul saat kamu butuh</li>
          <li>Tanpa email atau nomor HP</li>
        </ul>
      </aside>

      <main className="auth-card">
        <div className="segmented" role="group" aria-label="Pilih Masuk atau Daftar">
          <button type="button" aria-pressed={mode === 'masuk'} onClick={() => switchMode('masuk')}>
            Masuk
          </button>
          <button type="button" aria-pressed={mode === 'daftar'} onClick={() => switchMode('daftar')}>
            Daftar
          </button>
          <span className={`segmented__pill is-${mode}`} aria-hidden="true" />
        </div>

        <h1 className="auth-card__title">{mode === 'daftar' ? (asTeacher ? 'Buat akun Guru' : 'Buat akun NoBaku') : 'Masuk ke NoBaku'}</h1>
        <p className="muted auth-card__sub">
          {mode === 'daftar'
            ? asTeacher
              ? 'Kelola kelas VIII dan pantau belajar siswamu.'
              : 'Isi sebentar, lalu langsung belajar.'
            : 'Senang melihatmu lagi! Siswa dan guru masuk di sini.'}
        </p>

        {mode === 'daftar' && (
          <div className="role-pick" role="radiogroup" aria-label="Jenis akun">
            {[
              ['siswa', 'Siswa', 'Belajar bentuk baku'],
              ['guru', 'Guru', 'Kelola kelas & pantau siswa'],
            ].map(([id, label, desc]) => (
              <button key={id} type="button" role="radio" aria-checked={role === id} className={`role-pick__opt${role === id ? ' is-on' : ''}`} onClick={() => switchRole(id)}>
                <b>{label}</b>
                <span className="small">{desc}</span>
              </button>
            ))}
          </div>
        )}

        <form className="auth-form" onSubmit={submit} noValidate>
          {asTeacher && (
            <>
              <Field id="f-tname" label="Nama lengkap" error={errors.name}>
                <input
                  id="f-tname"
                  className="input"
                  value={form.name}
                  onChange={(e) => set('name')(e.target.value)}
                  autoComplete="name"
                  maxLength={80}
                  placeholder="mis. Sari Wulandari, S.Pd."
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'f-tname-err' : undefined}
                />
              </Field>
              <Field id="f-login" label="Email atau username" error={errors.login} hint="Dipakai untuk masuk.">
                <input
                  id="f-login"
                  className="input"
                  value={form.login}
                  onChange={(e) => set('login')(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={120}
                  placeholder="mis. sari@sekolah.sch.id"
                  aria-invalid={!!errors.login}
                  aria-describedby={errors.login ? 'f-login-err' : 'f-login-hint'}
                />
              </Field>
              <Field id="f-school" label="Nama sekolah atau instansi" error={errors.school}>
                <input
                  id="f-school"
                  className="input"
                  value={form.school}
                  onChange={(e) => set('school')(e.target.value)}
                  autoComplete="organization"
                  maxLength={120}
                  placeholder="mis. SMP Negeri 1 Bandung"
                  aria-invalid={!!errors.school}
                  aria-describedby={errors.school ? 'f-school-err' : undefined}
                />
              </Field>
            </>
          )}
          {mode === 'daftar' && !asTeacher && (
            <Field id="f-name" label="Nama panggilan" error={errors.name}>
              <input
                id="f-name"
                className="input"
                value={form.name}
                onChange={(e) => set('name')(e.target.value)}
                autoComplete="nickname"
                maxLength={30}
                placeholder="mis. Rani"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'f-name-err' : undefined}
              />
            </Field>
          )}

          {!asTeacher && (
          <Field id="f-user" label={mode === 'masuk' ? 'Username atau email' : 'Username'} error={errors.username} hint={mode === 'daftar' ? 'Huruf kecil/angka, 3–20 karakter.' : undefined}>
            <input
              id="f-user"
              className="input"
              value={form.username}
              onChange={(e) => set('username')(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={mode === 'masuk' ? 120 : 20}
              placeholder={mode === 'masuk' ? 'username siswa / email guru' : 'mis. rani_8a'}
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? 'f-user-err' : mode === 'daftar' ? 'f-user-hint' : undefined}
            />
          </Field>
          )}

          {mode === 'daftar' && !asTeacher && (
            <div className="form-field kelas-fixed">
              <span className="kelas-fixed__label">Kelas</span>
              <p className="kelas-fixed__value">
                <span className="chip">Kelas {KELAS}</span>
                <span className="small muted">NoBaku dirancang khusus untuk siswa kelas {KELAS}.</span>
              </p>
            </div>
          )}

          <Field id="f-pass" label="Kata sandi" error={errors.password} hint={mode === 'daftar' ? (asTeacher ? 'Minimal 8 karakter.' : 'Minimal 6 karakter.') : undefined}>
            <PasswordInput id="f-pass" value={form.password} onChange={set('password')} error={errors.password} autoComplete={mode === 'daftar' ? 'new-password' : 'current-password'} />
          </Field>

          {mode === 'daftar' && (
            <Field id="f-confirm" label="Ulangi kata sandi" error={errors.confirm}>
              <PasswordInput id="f-confirm" value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
            </Field>
          )}

          {errors.form && (
            <p className="form-field__error" role="alert">
              {errors.form}
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--lg btn--block btn--pop" disabled={busy || success}>
            {success ? 'Berhasil!' : busy ? 'Sebentar…' : mode === 'daftar' ? (asTeacher ? 'Daftar sebagai Guru' : 'Daftar & Mulai Belajar') : 'Masuk'}{' '}
            {!busy && !success && <IconArrowRight />}
          </button>
        </form>

        <p className="auth-card__switch small">
          {mode === 'daftar' ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          <button type="button" className="link-btn" onClick={() => switchMode(mode === 'daftar' ? 'masuk' : 'daftar')}>
            {mode === 'daftar' ? 'Masuk di sini' : 'Daftar sekarang'}
          </button>
        </p>
        <p className="auth-card__note small muted">
          {getServer() ? 'Akun tersimpan di server sekolah.' : 'Mode lokal: akun tersimpan di perangkat ini saja.'} Kata sandi disimpan dalam bentuk acak (hash), bukan teks asli.
        </p>
        <ServerSetting />
      </main>
    </div>
  );
}
