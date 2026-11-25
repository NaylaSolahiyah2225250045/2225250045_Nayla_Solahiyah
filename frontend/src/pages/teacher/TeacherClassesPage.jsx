import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CLASS_NAMES, classroom } from '../../lib/classroom.js';
import { useTeacherData, ago } from '../../features/teacher/data.js';
import { DataState, TeacherHero } from '../../features/teacher/ui.jsx';
import { IconClass } from '../../features/teacher/TeacherNav.jsx';

function thisYear(now = new Date()) {
  const y = now.getFullYear();
  return now.getMonth() >= 6 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

/** Kartu satu kelas: kode, jumlah & daftar siswa, terima siswa baru, kode baru, hapus. */
function ClassCard({ klass, students, onChanged }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'kode' | 'hapus' | id siswa
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn, done) => {
    setBusy(true);
    setMsg('');
    try {
      await fn();
      setConfirm(null);
      if (done) setMsg(done);
      await onChanged();
    } catch (e) {
      setMsg(e.message);
    }
    setBusy(false);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(klass.join_code);
      setMsg('Kode disalin.');
    } catch {
      setMsg(`Kode kelas: ${klass.join_code}`);
    }
  };

  return (
    <article className="card t-class">
      <header className="t-class__head">
        <span className="t-class__badge" aria-hidden="true">
          {klass.name.replace('VIII-', '')}
        </span>
        <div>
          <h2>Kelas {klass.name}</h2>
          <p className="small muted">
            {klass.academic_year ? `Tahun ajaran ${klass.academic_year} · ` : ''}
            {klass.student_count} siswa
          </p>
        </div>
      </header>

      <div className="t-class__code">
        <span className="small muted">Kode kelas</span>
        <b className="t-code" aria-label={`Kode kelas ${klass.join_code.split('').join(' ')}`}>
          {klass.join_code}
        </b>
        <button type="button" className="btn btn--sm" onClick={copy}>
          Salin
        </button>
      </div>
      <p className="small muted">Bagikan kode ini. Siswa memasukkannya di Profil Siswa → Kelas Saya.</p>

      <label className="t-switch">
        <input type="checkbox" checked={klass.join_enabled} disabled={busy} onChange={(e) => run(() => classroom().updateClass(klass.id, { join_enabled: e.target.checked }))} />
        <span>{klass.join_enabled ? 'Menerima siswa baru' : 'Tidak menerima siswa baru'}</span>
      </label>

      <div className="row t-class__actions">
        <button type="button" className="btn btn--sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'Tutup daftar siswa' : `Lihat siswa (${students.length})`}
        </button>
        <Link to={`/guru/progres?kelas=${klass.id}`} className="btn btn--sm btn--ghost">
          Progres kelas
        </Link>
        {confirm === 'kode' ? (
          <>
            <button type="button" className="btn btn--sm" disabled={busy} onClick={() => run(() => classroom().regenerateCode(klass.id), 'Kode baru dibuat. Kode lama tidak berlaku lagi.')}>
              Ya, buat kode baru
            </button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => setConfirm(null)}>
              Batal
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setConfirm('kode')}>
            Buat kode baru
          </button>
        )}
        {confirm === 'hapus' ? (
          <>
            <button type="button" className="btn btn--sm t-danger" disabled={busy} onClick={() => run(() => classroom().deleteClass(klass.id))}>
              Ya, hapus kelas
            </button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => setConfirm(null)}>
              Batal
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setConfirm('hapus')}>
            Hapus kelas
          </button>
        )}
      </div>
      {confirm === 'hapus' && <p className="small t-warn">Siswa akan keluar dari kelas ini. Progres belajar mereka tetap tersimpan di akun masing-masing.</p>}
      {msg && (
        <p className="small" role="status">
          {msg}
        </p>
      )}

      {open && (
        <div className="t-class__students">
          {students.length === 0 ? (
            <p className="small muted">Belum ada siswa. Bagikan kode {klass.join_code} kepada siswa kelas {klass.name}.</p>
          ) : (
            <ul>
              {students.map((s) => (
                <li key={s.id}>
                  <Link to={`/guru/siswa/${encodeURIComponent(s.id)}`}>
                    <b>{s.display_name}</b>
                    <span className="small muted">@{s.username} · bergabung {ago(s.joined_at)}</span>
                  </Link>
                  {confirm === s.id ? (
                    <span className="row">
                      <button type="button" className="btn btn--sm t-danger" disabled={busy} onClick={() => run(() => classroom().removeStudent(klass.id, s.id))}>
                        Keluarkan
                      </button>
                      <button type="button" className="btn btn--sm btn--ghost" onClick={() => setConfirm(null)}>
                        Batal
                      </button>
                    </span>
                  ) : (
                    <button type="button" className="btn btn--sm btn--ghost" onClick={() => setConfirm(s.id)} aria-label={`Keluarkan ${s.display_name} dari kelas`}>
                      Keluarkan
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

/** Kelas Saya: membuat kelas VIII-A–VIII-E, kode kelas, mengelola kelas & siswanya. */
export default function TeacherClassesPage() {
  const { loading, error, classes, reload } = useTeacherData();
  const taken = new Set(classes.map((c) => c.klass.name));
  const free = CLASS_NAMES.filter((n) => !taken.has(n));
  const [name, setName] = useState('');
  const [year, setYear] = useState(thisYear());
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const chosen = free.includes(name) ? name : free[0] ?? '';

  const create = async (e) => {
    e.preventDefault();
    if (!chosen) return;
    if (!/^\d{4}\/\d{4}$/.test(year)) {
      setMsg('Tulis tahun ajaran seperti 2026/2027.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      await classroom().createClass({ name: chosen, academic_year: year });
      setMsg(`Kelas ${chosen} dibuat. Bagikan kodenya ke siswa.`);
      await reload();
    } catch (err) {
      setMsg(err.message);
    }
    setBusy(false);
  };

  return (
    <main className="page page--wide stack t-page">
      <TeacherHero tone="account" Icon={IconClass} decor="kelas" poses={['point', 'book', 'smile']} title="Kelas Saya" text="Buat kelas VIII-A sampai VIII-E, bagikan kodenya, dan kelola siswamu." />

      <section className="card stack-s" aria-labelledby="buat-kelas">
        <h2 id="buat-kelas">Buat kelas</h2>
        {free.length === 0 ? (
          <p className="small muted">Kelima kelas (VIII-A sampai VIII-E) sudah kamu buat.</p>
        ) : (
          <form className="t-create" onSubmit={create}>
            <div className="t-create__names" role="radiogroup" aria-label="Nama kelas">
              {CLASS_NAMES.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={chosen === n} disabled={taken.has(n)} onClick={() => setName(n)} title={taken.has(n) ? 'Sudah dibuat' : undefined}>
                  {n}
                </button>
              ))}
            </div>
            <label className="t-create__year">
              <span className="small">Tahun ajaran</span>
              <input className="input" value={year} onChange={(e) => setYear(e.target.value)} maxLength={9} inputMode="numeric" />
            </label>
            <button type="submit" className="btn btn--primary" disabled={busy || !chosen}>
              {busy ? 'Sebentar…' : `Buat kelas ${chosen}`}
            </button>
          </form>
        )}
        {msg && (
          <p className="small" role="status">
            {msg}
          </p>
        )}
      </section>

      <DataState loading={loading} error={error} onRetry={reload} empty={!loading && !error && classes.length === 0} emptyText="Belum ada kelas. Pilih nama kelas di atas lalu tekan Buat kelas." />
      <div className="t-classes">
        {classes.map(({ klass, students }) => (
          <ClassCard key={klass.id} klass={klass} students={students} onChanged={reload} />
        ))}
      </div>
    </main>
  );
}
