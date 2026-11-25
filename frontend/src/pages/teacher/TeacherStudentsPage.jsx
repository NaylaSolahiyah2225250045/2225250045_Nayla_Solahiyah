import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PATH } from '../../lib/learner.js';
import { ago, lastActive, topicProgress, useTeacherData } from '../../features/teacher/data.js';
import { ClassFilter, DataState, Meter, TeacherHero } from '../../features/teacher/ui.jsx';
import { IconUsers } from '../../features/teacher/TeacherNav.jsx';

/** Daftar Siswa: siswa per kelas, dengan ringkasan singkat; buka detail tiap siswa. */
export default function TeacherStudentsPage() {
  const { loading, error, classes, reload } = useTeacherData();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const kelas = params.get('kelas') ?? 'semua';
  const shown = classes
    .filter((c) => kelas === 'semua' || c.klass.id === kelas)
    .flatMap((c) => c.students)
    .filter((s) => !q.trim() || `${s.display_name} ${s.username}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <main className="page page--wide stack t-page">
      <TeacherHero tone="progress" Icon={IconUsers} decor="siswa" poses={['wave', 'smile', 'wink']} title="Daftar Siswa" text="Lihat siswa di setiap kelas dan buka informasi masing-masing." />
      <DataState loading={loading} error={error} onRetry={reload} empty={!loading && !error && classes.length === 0} emptyText="Belum ada kelas." emptyAction={{ to: '/guru/kelas', label: 'Buat kelas' }} />
      {!loading && !error && classes.length > 0 && (
        <>
          <div className="t-toolbar">
            <ClassFilter classes={classes} value={kelas} onChange={(v) => setParams(v === 'semua' ? {} : { kelas: v }, { replace: true })} />
            <label className="t-search">
              <span className="sr-only">Cari siswa</span>
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau username" />
            </label>
          </div>
          {shown.length === 0 ? (
            <p className="muted">{q ? 'Tidak ada siswa yang cocok.' : 'Belum ada siswa di kelas ini. Bagikan kode kelas dari menu Kelas Saya.'}</p>
          ) : (
            <section className="card" aria-label="Tabel siswa">
              <div className="table-scroll">
                <table className="table t-table">
                  <thead>
                    <tr>
                      <th scope="col">Nama</th>
                      <th scope="col">Kelas</th>
                      <th scope="col">Topik selesai</th>
                      <th scope="col">Jalur latihan</th>
                      <th scope="col">Akurasi</th>
                      <th scope="col">Lencana</th>
                      <th scope="col">Terakhir aktif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((s) => {
                      const topics = topicProgress(s.sum);
                      const done = topics.filter((t) => t.completed).length;
                      const badges = s.sum.rewards.badges.filter((b) => b.earned).length;
                      return (
                        <tr key={s.id}>
                          <th scope="row">
                            <Link to={`/guru/siswa/${encodeURIComponent(s.id)}`} className="t-name">
                              {s.display_name}
                              <span className="small muted">@{s.username}</span>
                            </Link>
                          </th>
                          <td>{s.className}</td>
                          <td>
                            {done}/{topics.length}
                          </td>
                          <td>
                            <span className="t-cellmeter">
                              <Meter value={s.sum.nodesDone} max={PATH.length} label={`${s.sum.nodesDone} dari ${PATH.length} titik latihan`} />
                              <span className="small">
                                {s.sum.nodesDone}/{PATH.length}
                              </span>
                            </span>
                          </td>
                          <td>{s.sum.answered ? `${s.sum.accuracy}%` : '–'}</td>
                          <td>{badges}</td>
                          <td className="small">{s.sum.hasData ? ago(lastActive(s.sum)) : 'belum sinkron'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
