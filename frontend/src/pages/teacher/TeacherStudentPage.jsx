import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { classroom } from '../../lib/classroom.js';
import { summarizeSnapshot } from '../../lib/snapshot.js';
import { PATH } from '../../lib/learner.js';
import { nodeLabel } from '../../lib/path.js';
import { errorLabel } from '../../content/messages.js';
import { phaseLabel } from '../../lib/rmt.js';

/** Label kesalahan + fase fungsi kognitif RMT yang mungkin terlibat (docs/RMT.md), mis. "Letak koma · Output/Elaborasi". */
export const errorWithPhase = (code) => {
  const base = errorLabel[code] ?? code;
  const phase = phaseLabel(code);
  return phase ? `${base} · ${phase}` : base;
};
import BadgeIcon from '../../components/BadgeIcon.jsx';
import { ago, finalScore, KIND_LABEL, lastActive, topicProgress } from '../../features/teacher/data.js';
import { BarList, Meter, StatTile } from '../../features/teacher/ui.jsx';

/** Satu sesi riwayat siswa: nilai + rincian soal (bisa dibuka). */
export function SessionRow({ s, showStudent }) {
  return (
    <li className="t-session">
      <details>
        <summary>
          <span className="t-session__title">
            {showStudent && <b>{showStudent} · </b>}
            {s.title}
          </span>
          <span className="small muted">
            {KIND_LABEL[s.kind] ?? s.kind} · {ago(s.at)}
          </span>
          <span className={`badge ${s.correct >= Math.ceil(s.total * 0.6) ? 'badge--ok' : 'badge--bad'}`}>
            {s.correct}/{s.total} · {s.score}
          </span>
        </summary>
        {s.items?.length ? (
          <ol className="t-items">
            {s.items.map((it, i) => (
              <li key={i} className={it.correct ? 'is-ok' : 'is-bad'}>
                <span className="small">
                  {i + 1}. {it.prompt || 'Soal'}
                </span>
                <span className="small">
                  Jawaban: <span className="sci">{it.response}</span> — {it.correct ? 'benar' : `salah${it.errorCode ? ` (${errorWithPhase(it.errorCode)})` : ''}`}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="small muted">Rincian soal tidak tersedia.</p>
        )}
      </details>
    </li>
  );
}

/** Informasi satu siswa: progres per topik, jalur latihan, lencana, hasil & kesalahan tersering. */
export default function TeacherStudentPage() {
  const { id } = useParams();
  const [data, setData] = useState({ loading: true, error: '', detail: null });
  useEffect(() => {
    classroom()
      .studentDetail(id)
      .then((detail) => setData({ loading: false, error: '', detail }))
      .catch((e) => setData({ loading: false, error: e.message, detail: null }));
  }, [id]);

  if (data.loading) return <main className="page page--wide t-page muted">Memuat…</main>;
  if (data.error)
    return (
      <main className="page page--wide stack t-page">
        <p role="alert">{data.error}</p>
        <Link to="/guru/siswa" className="btn btn--sm">
          Kembali ke Daftar Siswa
        </Link>
      </main>
    );

  const { student, class_name: className } = data.detail;
  const sum = summarizeSnapshot(student.snapshot);
  const topics = topicProgress(sum);
  const final = finalScore(sum);
  const errors = {};
  Object.values(sum.progressMap).forEach((p) => Object.entries(p.errors ?? {}).forEach(([k, v]) => (errors[k] = (errors[k] ?? 0) + v)));
  const errorBars = Object.entries(errors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => ({ label: errorWithPhase(k), value: v, display: `${v}×` }));
  const earned = sum.rewards.badges.filter((b) => b.earned);

  return (
    <main className="page page--wide stack t-page">
      <Link to="/guru/siswa" className="small t-back">
        ← Daftar Siswa
      </Link>
      <header className="t-student-head card">
        <span className="t-avatar t-avatar--lg" aria-hidden="true">
          {student.display_name.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <h1>{student.display_name}</h1>
          <p className="small muted">
            @{student.username} · Kelas {className} · bergabung {ago(student.joined_at)}
          </p>
          <p className="small muted">{sum.hasData ? `Data diperbarui ${ago(student.snapshot_at)}` : 'Siswa belum mengirim data belajar (belum belajar setelah bergabung).'}</p>
        </div>
      </header>

      <div className="t-stats">
        <StatTile label="Level & XP" value={`Lv ${sum.rewards.level}`} note={`${sum.rewards.xp} XP`} tone="learn" />
        <StatTile label="Akurasi" value={sum.answered ? `${sum.accuracy}%` : '–'} note={`${sum.correct}/${sum.answered} jawaban benar`} tone="progress" />
        <StatTile label="Hari belajar" value={sum.stats.activeDays} note={`terakhir ${ago(lastActive(sum))}`} tone="install" />
        <StatTile label="Buku materi" value={`${sum.bookRead} hlm`} note={`Kuis Akhir: ${final ?? 'belum'}`} tone="account" />
      </div>

      <div className="t-grid">
        <section className="card stack-s" aria-labelledby="s-topik">
          <h2 id="s-topik">Progres per topik</h2>
          <ul className="t-topics">
            {topics.map((t) => (
              <li key={t.module.id}>
                <span className="t-topics__name">
                  Topik {t.module.no} · {t.module.short}
                </span>
                <Meter value={t.levelsDone} max={t.levels} label={t.levelsDone >= t.levels ? "Latihan selesai" : "Latihan belum selesai"} />
                <span className="small">
                  {t.levelsDone >= t.levels ? "Latihan ✓" : "Latihan belum"}
                </span>
                <span className={`chip ${t.completed ? 't-chip-ok' : ''}`}>{t.completed ? `Kuis ${t.bestQuiz}` : 'Kuis belum'}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card stack-s" aria-labelledby="s-jalur">
          <h2 id="s-jalur">Jalur latihan</h2>
          <p className="small muted">
            {sum.nodesDone} dari {PATH.length} titik selesai{sum.currentNode ? ` · sedang di ${nodeLabel(sum.currentNode)}` : ''}.
          </p>
          <ol className="t-nodes" aria-label="Status titik jalur latihan">
            {PATH.map((n) => (
              <li key={n.id} className={`is-${sum.statuses[n.id]}`} title={`${nodeLabel(n)}: ${sum.statuses[n.id] === 'done' ? 'selesai' : sum.statuses[n.id] === 'current' ? 'sedang dikerjakan' : 'belum'}`}>
                {n.kind === 'final' ? 'KA' : `T${n.moduleNo}`}
              </li>
            ))}
          </ol>
          <p className="small muted t-legend">
            <span className="t-dot is-done" /> selesai <span className="t-dot is-current" /> sedang dikerjakan <span className="t-dot is-locked" /> belum
          </p>
        </section>

        <section className="card stack-s" aria-labelledby="s-lencana">
          <h2 id="s-lencana">
            Lencana ({earned.length}/{sum.rewards.badges.length})
          </h2>
          {earned.length === 0 ? (
            <p className="small muted">Belum ada lencana.</p>
          ) : (
            <ul className="t-badges">
              {earned.map((b) => (
                <li key={b.id} title={b.desc}>
                  <BadgeIcon tier={b.tier} emblem={b.emblem} size={44} />
                  <span className="small">{b.name}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card stack-s" aria-labelledby="s-salah">
          <h2 id="s-salah">Kesalahan tersering</h2>
          {errorBars.length === 0 ? <p className="small muted">Belum ada kesalahan tercatat.</p> : <BarList items={errorBars} />}
        </section>

        <section className="card stack-s t-grid__wide" aria-labelledby="s-hasil">
          <h2 id="s-hasil">Hasil latihan & kuis</h2>
          {sum.history.sessions.length === 0 ? (
            <p className="small muted">Belum ada latihan atau kuis.</p>
          ) : (
            <ul className="t-sessions">
              {sum.history.sessions.map((s) => (
                <SessionRow key={s.id} s={s} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
