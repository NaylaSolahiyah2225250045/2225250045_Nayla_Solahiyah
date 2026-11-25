import { useEffect, useState } from 'react';
import { classroom, normalizeCode, usesServer } from '../lib/classroom.js';
import { buildSnapshot } from '../lib/snapshot.js';

/** Profil Siswa: bergabung ke kelas guru dengan kode, melihat kelas, atau keluar dari kelas. */
export default function JoinClassCard() {
  const [classes, setClasses] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const refresh = () =>
    classroom()
      .myClasses()
      .then(setClasses)
      .catch((e) => {
        setClasses([]);
        setError(e.message);
      });
  useEffect(() => {
    refresh();
  }, []);

  const join = async (e) => {
    e.preventDefault();
    const c = normalizeCode(code);
    if (c.length !== 6) {
      setError('Kode kelas terdiri dari 6 huruf/angka.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await classroom().joinClass(c);
      await classroom()
        .pushSnapshot(buildSnapshot())
        .catch(() => {});
      setCode('');
      await refresh();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  const leave = async (id) => {
    setBusy(true);
    try {
      await classroom().leaveClass(id);
      setConfirmLeave(false);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  const current = classes?.[0];
  return (
    <section className="card stack-s join-class" aria-labelledby="kelas-saya">
      <h2 id="kelas-saya">Kelas Saya</h2>
      {classes === null ? (
        <p className="muted small">Memuat…</p>
      ) : current ? (
        <>
          <div className="join-class__current">
            <span className="join-class__badge" aria-hidden="true">
              {current.name.replace('VIII-', '')}
            </span>
            <div>
              <b>Kelas {current.name}</b>
              <p className="small muted">
                Guru: {current.teacher_name}
                {current.school ? ` · ${current.school}` : ''}
              </p>
            </div>
          </div>
          <p className="small muted">Gurumu bisa melihat progres belajar, hasil latihan & kuis, dan lencanamu. Datanya diperbarui otomatis.</p>
          {confirmLeave ? (
            <div className="row">
              <button type="button" className="btn btn--sm" onClick={() => leave(current.id)} disabled={busy}>
                Ya, keluar dari kelas
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmLeave(false)}>
                Batal
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmLeave(true)}>
              Keluar dari kelas
            </button>
          )}
        </>
      ) : (
        <form className="join-class__form" onSubmit={join} noValidate>
          <p className="small muted">Punya kode kelas dari gurumu? Masukkan di sini supaya gurumu bisa memantau belajarmu.</p>
          <label htmlFor="join-code" className="sr-only">
            Kode kelas
          </label>
          <div className="row">
            <input
              id="join-code"
              className="input join-class__input"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="mis. K7M2QX"
              maxLength={8}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!error}
              aria-describedby={error ? 'join-code-err' : undefined}
            />
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? 'Sebentar…' : 'Gabung'}
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className="form-field__error" id="join-code-err" role="alert">
          {error}
        </p>
      )}
      {!usesServer() && <p className="small muted">Mode lokal: kelas hanya tersimpan di perangkat ini.</p>}
    </section>
  );
}
