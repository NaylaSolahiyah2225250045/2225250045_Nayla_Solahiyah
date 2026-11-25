import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { PHASES } from '../../content/rmt.js';
import { avg, finalScore, useTeacherData } from '../../features/teacher/data.js';
import { BarList, ClassFilter, DataState, StatTile, TeacherHero } from '../../features/teacher/ui.jsx';
import { IconHistory } from '../../components/NavIcons.jsx';
import { errorWithPhase, SessionRow } from './TeacherStudentPage.jsx';

const KINDS = [
  ['semua', 'Semua'],
  ['latihan', 'Latihan'],
  ['kuis', 'Kuis'],
  ['ulang', 'Ulang soal'],
];

/** Hasil Latihan & Kuis: nilai, riwayat pengerjaan semua siswa, dan kesalahan tersering di kelas. */
export default function TeacherResultsPage() {
  const { loading, error, classes, reload } = useTeacherData();
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState('semua');
  const kelas = params.get('kelas') ?? 'semua';
  const students = classes.filter((c) => kelas === 'semua' || c.klass.id === kelas).flatMap((c) => c.students);
  const sessions = students
    .flatMap((s) => s.sum.history.sessions.map((h) => ({ ...h, student: s })))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
  const shown = sessions.filter((s) => kind === 'semua' || s.kind === kind);
  const practice = sessions.filter((s) => s.kind === 'latihan').map((s) => s.score);
  const quiz = sessions.filter((s) => s.kind === 'kuis').map((s) => s.score);
  const finals = students.map((s) => finalScore(s.sum)).filter((x) => x !== null);

  const errors = {};
  students.forEach((s) => Object.values(s.sum.progressMap).forEach((p) => Object.entries(p.errors ?? {}).forEach(([k, v]) => (errors[k] = (errors[k] ?? 0) + v))));
  const errorBars = Object.entries(errors)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ label: errorWithPhase(k), value: v, display: `${v}×` }));

  return (
    <main className="page page--wide stack t-page">
      <TeacherHero tone="progress" Icon={IconHistory} decor="hasil" poses={['cheer', 'thumb', 'happy']} title="Hasil Latihan & Kuis" text="Nilai, hasil pengerjaan, dan riwayat latihan serta kuis siswa." />
      <DataState loading={loading} error={error} onRetry={reload} empty={!loading && !error && classes.length === 0} emptyText="Belum ada kelas." emptyAction={{ to: '/guru/kelas', label: 'Buat kelas' }} />
      {!loading && !error && classes.length > 0 && (
        <>
          <ClassFilter classes={classes} value={kelas} onChange={(v) => setParams(v === 'semua' ? {} : { kelas: v }, { replace: true })} />
          <div className="t-stats">
            <StatTile label="Rata-rata latihan" value={avg(practice) ?? '–'} note={`${practice.length} sesi latihan`} tone="learn" />
            <StatTile label="Rata-rata kuis" value={avg(quiz) ?? '–'} note={`${quiz.length} kuis dikerjakan`} tone="progress" />
            <StatTile label="Kuis Akhir" value={avg(finals) ?? '–'} note={`${finals.length}/${students.length} siswa sudah mengerjakan`} tone="install" />
            <StatTile label="Total pengerjaan" value={sessions.length} note="latihan, kuis, & ulang soal" tone="account" />
          </div>
          <div className="t-grid">
            <section className="card stack-s t-grid__wide" aria-labelledby="h-riwayat">
              <div className="row row--between t-wrap">
                <h2 id="h-riwayat">Riwayat pengerjaan</h2>
                <div className="t-filter t-filter--sm" role="group" aria-label="Jenis pengerjaan">
                  {KINDS.map(([id, label]) => (
                    <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {shown.length === 0 ? (
                <p className="small muted">Belum ada pengerjaan.</p>
              ) : (
                <ul className="t-sessions">
                  {shown.slice(0, 80).map((s) => (
                    <SessionRow key={`${s.student.id}-${s.id}`} s={s} showStudent={`${s.student.display_name} (${s.student.className})`} />
                  ))}
                </ul>
              )}
            </section>
            <section className="card stack-s" aria-labelledby="h-salah">
              <h2 id="h-salah">Kesalahan tersering di kelas</h2>
              {errorBars.length === 0 ? <p className="small muted">Belum ada kesalahan tercatat.</p> : <BarList items={errorBars} />}
              <p className="small muted">Gunakan untuk memilih materi yang perlu diulas bersama.</p>
              {errorBars.length > 0 && (
                <details className="t-phases">
                  <summary className="small">Arti Input, Elaborasi, Output</summary>
                  <ul className="small muted">
                    {Object.values(PHASES).map((p) => (
                      <li key={p.label}>
                        <b>{p.label}</b>: {p.desc}.
                      </li>
                    ))}
                  </ul>
                  <p className="small muted">
                    Fase fungsi kognitif (RMT) yang mungkin terlibat. Satu kesalahan bisa melibatkan lebih dari satu fase; kesalahan tanpa label belum cukup bukti untuk dipetakan.
                  </p>
                </details>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
