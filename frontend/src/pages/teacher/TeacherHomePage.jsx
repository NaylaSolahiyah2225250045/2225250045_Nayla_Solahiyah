import { Link } from 'react-router-dom';
import { useSession } from '../../lib/account.js';
import { usesServer } from '../../lib/classroom.js';
import { AVAILABLE_MODULES } from '../../lib/learner.js';
import { activeWithin, ago, avg, KIND_LABEL, topicProgress, useTeacherData } from '../../features/teacher/data.js';
import { BarList, DataState, StatTile } from '../../features/teacher/ui.jsx';
import MascotLive from '../../components/MascotLive.jsx';
import Decor from '../../components/Decor.jsx';

/** Beranda Guru: ringkasan kelas & siswa, aktivitas terbaru, perkembangan belajar per topik. */
export default function TeacherHomePage() {
  const session = useSession();
  const { loading, error, classes, students, reload } = useTeacherData();
  const pending = session?.status === 'pending';

  const active7 = students.filter((s) => activeWithin(s.sum, 7)).length;
  const avgAccuracy = avg(students.filter((s) => s.sum.answered > 0).map((s) => s.sum.accuracy));
  const quizScores = students.flatMap((s) => s.sum.history.sessions.filter((h) => h.kind === 'kuis').map((h) => h.score));
  const topicBars = AVAILABLE_MODULES.map((m, i) => {
    const done = students.filter((s) => topicProgress(s.sum)[i].completed).length;
    return { label: `Topik ${m.no} · ${m.short}`, value: done, max: Math.max(1, students.length), display: `${done}/${students.length} siswa` };
  });
  const recent = students
    .flatMap((s) => s.sum.history.sessions.map((h) => ({ ...h, student: s })))
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8);

  return (
    <main className="page page--wide stack t-page">
      <section className="t-welcome">
        <Decor set="guru" />
        <div className="t-welcome__text">
          <p className="t-welcome__kicker">Dashboard Guru</p>
          <h1>Halo, {session?.name}!</h1>
          <p>{session?.school}</p>
          {!pending && (
            <div className="row t-welcome__actions">
              <Link to="/guru/kelas" className="btn btn--cta">
                Kelola kelas
              </Link>
              <Link to="/guru/progres" className="btn btn--glass">
                Lihat progres
              </Link>
            </div>
          )}
        </div>
        <div className="t-welcome__art">
          <MascotLive poses={['wave', 'book', 'thumb']} size={120} lines={['Selamat datang, Bapak/Ibu Guru!', 'Pantau belajar siswa di sini.']} bubble="top" />
        </div>
      </section>

      {pending && (
        <div className="card t-pending" role="status">
          <b>Akun guru menunggu verifikasi.</b>
          <p className="small">Admin sekolah perlu mengaktifkan akunmu dulu. Setelah aktif, kamu bisa membuat kelas dan melihat data siswa.</p>
        </div>
      )}

      {!pending && (
        <>
          <DataState loading={loading} error={error} onRetry={reload} />
          {!loading && !error && (
            <>
              <div className="t-stats">
                <StatTile label="Kelas" value={classes.length} note={classes.map((c) => c.klass.name).join(', ') || 'Belum ada kelas'} tone="learn" />
                <StatTile label="Siswa" value={students.length} note="tergabung di kelasmu" tone="progress" />
                <StatTile label="Aktif 7 hari" value={students.length ? `${active7}/${students.length}` : '–'} note="siswa belajar minggu ini" tone="install" />
                <StatTile label="Akurasi rata-rata" value={avgAccuracy === null ? '–' : `${avgAccuracy}%`} note={`rata-rata kuis ${avg(quizScores) ?? '–'}`} tone="account" />
              </div>

              {classes.length === 0 ? (
                <DataState empty emptyText="Belum ada kelas. Buat kelas VIII-A sampai VIII-E, lalu bagikan kodenya ke siswa." emptyAction={{ to: '/guru/kelas', label: 'Buat kelas pertama' }} />
              ) : (
                <div className="t-grid">
                  <section className="card stack-s" aria-labelledby="t-topik">
                    <h2 id="t-topik">Perkembangan belajar</h2>
                    <p className="small muted">Banyak siswa yang sudah menyelesaikan tiap topik (kuis topik dikerjakan).</p>
                    <BarList items={topicBars} />
                  </section>
                  <section className="card stack-s" aria-labelledby="t-aktivitas">
                    <h2 id="t-aktivitas">Aktivitas terbaru</h2>
                    {recent.length === 0 ? (
                      <p className="small muted">Belum ada aktivitas. Data muncul setelah siswa mengerjakan latihan atau kuis.</p>
                    ) : (
                      <ul className="t-feed">
                        {recent.map((r) => (
                          <li key={`${r.student.id}-${r.id}`}>
                            <Link to={`/guru/siswa/${encodeURIComponent(r.student.id)}`} className="t-feed__who">
                              {r.student.display_name}
                            </Link>
                            <span className="t-feed__what small">
                              {KIND_LABEL[r.kind] ?? r.kind} · {r.title}
                            </span>
                            <span className={`badge ${r.correct >= Math.ceil(r.total * 0.6) ? 'badge--ok' : 'badge--bad'}`}>{r.score}</span>
                            <span className="t-feed__when small muted">
                              {r.student.className} · {ago(r.at)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  <section className="card stack-s t-grid__wide" aria-labelledby="t-kelas">
                    <div className="row row--between">
                      <h2 id="t-kelas">Kelasku</h2>
                      <Link to="/guru/kelas" className="small">
                        Kelola
                      </Link>
                    </div>
                    <ul className="t-classmini">
                      {classes.map(({ klass, students: ss }) => (
                        <li key={klass.id}>
                          <Link to={`/guru/siswa?kelas=${klass.id}`}>
                            <b>{klass.name}</b>
                            <span className="small muted">{ss.length} siswa</span>
                            <span className="small muted">Kode {klass.join_code}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              )}
            </>
          )}
        </>
      )}
      <p className="small muted t-mode">{usesServer() ? 'Data diambil dari server sekolah.' : 'Mode lokal: kelas & data siswa hanya dari perangkat ini.'}</p>
    </main>
  );
}
