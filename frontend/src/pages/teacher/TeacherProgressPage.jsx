import { Link, useSearchParams } from 'react-router-dom';
import { AVAILABLE_MODULES } from '../../lib/learner.js';
import { BADGES } from '../../lib/rewards.js';
import { finalScore, topicProgress, useTeacherData } from '../../features/teacher/data.js';
import { BarList, ClassFilter, DataState, TeacherHero } from '../../features/teacher/ui.jsx';
import { IconChart } from '../../features/teacher/TeacherNav.jsx';

/** Isi sel matriks: ✓ (topik selesai), "Latihan" (latihan 10 soal sudah lulus), atau –. */
function Cell({ t }) {
  if (t.completed) return <span className="t-cell is-done" title={`Selesai · kuis ${t.bestQuiz}`}>✓ {t.bestQuiz}</span>;
  if (t.levelsDone > 0) return <span className="t-cell is-part" title="Latihan 10 soal sudah lulus, kuis topik belum">Latihan</span>;
  return <span className="t-cell is-none" title="Belum mulai">–</span>;
}

/** Progres Belajar: matriks siswa × topik, rata-rata per topik, materi dibaca, sebaran lencana. */
export default function TeacherProgressPage() {
  const { loading, error, classes, reload } = useTeacherData();
  const [params, setParams] = useSearchParams();
  const kelas = params.get('kelas') ?? classes[0]?.klass.id ?? 'semua';
  const students = classes.filter((c) => kelas === 'semua' || c.klass.id === kelas).flatMap((c) => c.students);
  const n = students.length;

  const levelBars = AVAILABLE_MODULES.map((m, i) => {
    const total = students.reduce((s, st) => s + topicProgress(st.sum)[i].levelsDone, 0);
    const perTopic = n ? topicProgress(students[0].sum)[i].levels : 1;
    const pct = n ? Math.round((total / (n * perTopic)) * 100) : 0;
    return { label: `Topik ${m.no} · ${m.short}`, value: pct, max: 100, display: `${pct}%` };
  });
  const badgeBars = BADGES.map((b) => {
    const count = students.filter((s) => s.sum.rewards.badges.find((x) => x.id === b.id)?.earned).length;
    return { label: b.name, value: count, max: Math.max(1, n), display: `${count}/${n}` };
  }).sort((a, b) => b.value - a.value);

  return (
    <main className="page page--wide stack t-page">
      <TeacherHero tone="learn" Icon={IconChart} decor="progres" poses={['think', 'idea', 'thumb']} title="Progres Belajar" text="Pantau materi yang dipelajari, penyelesaian level latihan, dan lencana siswa." />
      <DataState loading={loading} error={error} onRetry={reload} empty={!loading && !error && classes.length === 0} emptyText="Belum ada kelas." emptyAction={{ to: '/guru/kelas', label: 'Buat kelas' }} />
      {!loading && !error && classes.length > 0 && (
        <>
          <ClassFilter classes={classes} value={kelas} onChange={(v) => setParams({ kelas: v }, { replace: true })} />
          {n === 0 ? (
            <p className="muted">Belum ada siswa di kelas ini.</p>
          ) : (
            <>
              <section className="card stack-s" aria-labelledby="p-matriks">
                <h2 id="p-matriks">Penyelesaian per siswa</h2>
                <p className="small muted">✓ = topik selesai (nilai kuis topik) · Latihan = latihan 10 soal sudah lulus · KA = Kuis Akhir.</p>
                <div className="table-scroll">
                  <table className="table t-table t-matrix">
                    <thead>
                      <tr>
                        <th scope="col">Siswa</th>
                        {AVAILABLE_MODULES.map((m) => (
                          <th key={m.id} scope="col" title={m.title}>
                            T{m.no}
                          </th>
                        ))}
                        <th scope="col">KA</th>
                        <th scope="col">Buku</th>
                        <th scope="col">Lencana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => {
                        const topics = topicProgress(s.sum);
                        const fs = finalScore(s.sum);
                        return (
                          <tr key={s.id}>
                            <th scope="row">
                              <Link to={`/guru/siswa/${encodeURIComponent(s.id)}`}>{s.display_name}</Link>
                            </th>
                            {topics.map((t) => (
                              <td key={t.module.id}>
                                <Cell t={t} />
                              </td>
                            ))}
                            <td>{fs === null ? '–' : fs}</td>
                            <td>{s.sum.bookRead}</td>
                            <td>{s.sum.rewards.badges.filter((b) => b.earned).length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
              <div className="t-grid">
                <section className="card stack-s" aria-labelledby="p-level">
                  <h2 id="p-level">Latihan selesai per topik</h2>
                  <p className="small muted">Persentase siswa yang sudah lulus latihan 10 soal ({n} siswa).</p>
                  <BarList items={levelBars} max={100} />
                </section>
                <section className="card stack-s" aria-labelledby="p-lencana">
                  <h2 id="p-lencana">Lencana yang diraih</h2>
                  <p className="small muted">Banyak siswa yang sudah meraih setiap lencana.</p>
                  <BarList items={badgeBars} />
                </section>
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
