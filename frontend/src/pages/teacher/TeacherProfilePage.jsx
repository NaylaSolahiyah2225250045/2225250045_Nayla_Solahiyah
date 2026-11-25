import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, refreshProfile, updateTeacherProfile, useSession } from '../../lib/account.js';
import { usesServer } from '../../lib/classroom.js';
import { getServer } from '../../lib/api.js';
import MotionToggle from '../../components/MotionToggle.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { openTour } from '../../lib/onboarding.js';
import { TeacherBadge } from '../../features/teacher/TeacherNav.jsx';
import Decor from '../../components/Decor.jsx';

/** Profil Guru: data akun, ubah nama & sekolah, status verifikasi, keluar. */
export default function TeacherProfilePage() {
  const session = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: session?.name ?? '', school: session?.school ?? '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await updateTeacherProfile(form);
    setMsg(r.ok ? 'Profil disimpan.' : r.error);
    setBusy(false);
  };

  return (
    <main className="page page--wide stack t-page">
      <section className="t-welcome t-welcome--profile">
        <Decor set="profile" />
        <TeacherBadge size={84} />
        <div className="t-welcome__text">
          <p className="t-welcome__kicker">Profil Guru</p>
          <h1>{session?.name}</h1>
          <p>{session?.school}</p>
          <p className="row t-chips">
            <span className="chip chip--glass">{session?.username}</span>
            <span className="chip chip--glass">{session?.status === 'pending' ? 'Menunggu verifikasi' : 'Akun aktif'}</span>
          </p>
        </div>
      </section>

      <div className="t-grid">
        <section className="card stack-s" aria-labelledby="g-data">
          <h2 id="g-data">Data akun</h2>
          <form className="stack-s" onSubmit={save}>
            <label className="t-field">
              <span className="small">Nama lengkap</span>
              <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={80} autoComplete="name" />
            </label>
            <label className="t-field">
              <span className="small">Sekolah atau instansi</span>
              <input className="input" value={form.school} onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))} maxLength={120} autoComplete="organization" />
            </label>
            <p className="small muted">Email/username untuk masuk: {session?.username}</p>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? 'Menyimpan…' : 'Simpan perubahan'}
            </button>
            {msg && (
              <p className="small" role="status">
                {msg}
              </p>
            )}
          </form>
        </section>

        <section className="card stack-s" aria-labelledby="g-set">
          <h2 id="g-set">Pengaturan</h2>
          <div className="row row--between">
            <span>Animasi</span>
            <MotionToggle />
          </div>
          <div className="row row--between">
            <span>Musik latar</span>
            <SoundToggle kind="music" />
          </div>
          <div className="row row--between">
            <span>Efek suara</span>
            <SoundToggle kind="sfx" />
          </div>
          <div className="row row--between">
            <span>Panduan Dashboard Guru</span>
            <button type="button" className="btn btn--sm" onClick={openTour}>
              Buka panduan guru
            </button>
          </div>
          <p className="small muted">
            {usesServer() ? `Terhubung ke server sekolah (${getServer().replace(/\/api\/v1$/, '')}).` : 'Mode lokal: kelas & data siswa hanya tersimpan di perangkat ini. Untuk memantau siswa di perangkat lain, gunakan server sekolah.'}
          </p>
          <p className="small muted">Kamu hanya bisa melihat siswa yang bergabung ke kelasmu. Data yang terlihat: progres, hasil latihan & kuis, dan lencana — tanpa email atau nomor HP siswa.</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              logout();
              navigate('/masuk', { replace: true });
            }}
          >
            Keluar
          </button>
        </section>
      </div>
    </main>
  );
}
