import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getModule } from '../content/modules.js';
import { BANK, LEVELS, PASS_COUNT, PER_SESSION } from '../content/bank.js';
import { progress, useProgress, getModuleProgress } from '../lib/progress.js';
import { shuffle } from '../lib/shuffle.js';
import { logActivity } from '../lib/activity.js';
import { recordSession } from '../lib/history.js';
import AppBar from '../components/AppBar.jsx';
import QuestionCard from '../features/practice/QuestionCard.jsx';
import Feedback from '../components/Feedback.jsx';
import { IconLock } from '../components/Icons.jsx';

export default function PracticePage() {
  const { id } = useParams();
  const module = getModule(id);
  useProgress();
  const [session, setSession] = useState(null); // {level, questions, index, results}

  if (!module || !BANK[id]) return <Navigate to="/beranda" replace />;
  const mp = getModuleProgress(id);

  const start = (level) =>
    setSession({ level, questions: shuffle(BANK[id].levels[level]).slice(0, PER_SESSION), index: 0, results: [] });

  // ---------- Pilih level ----------
  if (!session) {
    return (
      <>
        <AppBar title={`Latihan · ${module.short}`} back={`/modul/${id}`} />
        <main className="page page--focus stack">
          <h2>Pilih level</h2>
          <p className="muted">Mulai dari Level 1. Level berikutnya terbuka jika kamu menjawab benar minimal {PASS_COUNT} dari {PER_SESSION} soal.</p>
          <div className="levels">
            {LEVELS.map((l) => {
              const locked = l.level > mp.levelUnlocked;
              return (
                <button key={l.level} type="button" className="level" disabled={locked} onClick={() => start(l.level)}>
                  <span className="row row--between">
                    <span className="level__name">L{l.level}</span>
                    {locked && <IconLock />}
                  </span>
                  <span>{l.name}</span>
                  <span className="small muted">{l.desc}</span>
                </button>
              );
            })}
          </div>
          <Link to={`/modul/${id}`} className="btn btn--block">
            Kembali ke materi
          </Link>
        </main>
      </>
    );
  }

  const { level, questions, index, results } = session;

  // ---------- Ringkasan sesi ----------
  if (index >= questions.length) {
    const correct = results.filter((r) => r.correct).length;
    const passed = correct >= PASS_COUNT;
    return (
      <>
        <AppBar title={`Latihan L${level}`} back={`/modul/${id}`} />
        <main className="page page--focus stack">
          <h2>Hasil Level {level}</h2>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat__value">
                {correct}/{questions.length}
              </div>
              <div className="small muted">soal benar</div>
            </div>
            <div className="stat">
              <div className="stat__value">{results.reduce((s, r) => s + (r.hintsUsed ?? 0), 0)}</div>
              <div className="small muted">petunjuk dipakai</div>
            </div>
          </div>
          {passed ? (
            <Feedback kind="ok" title={level < 4 ? `Level ${level + 1} terbuka!` : 'Kamu menuntaskan semua level!'}>
              <p>{level < 4 ? 'Lanjutkan ke level berikutnya, atau coba kuis.' : 'Saatnya mengerjakan kuis modul ini.'}</p>
            </Feedback>
          ) : (
            <Feedback kind="info" title="Ayo coba sekali lagi">
              <p>Kamu perlu {PASS_COUNT} jawaban benar. Lihat lagi contoh terurai di materi bila perlu.</p>
            </Feedback>
          )}
          <div className="stack-s">
            {passed && level < 4 && (
              <button type="button" className="btn btn--primary btn--block" onClick={() => start(level + 1)}>
                Lanjut ke Level {level + 1}
              </button>
            )}
            <button type="button" className={`btn btn--block${passed && level < 4 ? '' : ' btn--primary'}`} onClick={() => start(level)}>
              Ulangi Level {level}
            </button>
            <button type="button" className="btn btn--block" onClick={() => setSession(null)}>
              Pilih level lain
            </button>
            <Link to={`/modul/${id}/kuis`} className="btn btn--ghost btn--block">
              Ke kuis modul
            </Link>
          </div>
        </main>
      </>
    );
  }

  // ---------- Mengerjakan soal ----------
  const onDone = (r) => {
    const nextResults = [...results, r];
    if (index + 1 >= questions.length) {
      const correct = nextResults.filter((x) => x.correct).length;
      if (correct >= PASS_COUNT) progress.unlockLevel(id, level + 1);
      recordSession({
        kind: 'latihan',
        nodeId: `${id}-l${level}`,
        moduleId: id,
        title: `Modul ${module.no} · Level ${level}`,
        items: nextResults.map((x, i) => ({ q: questions[i], response: x.response, correct: x.correct, errorCode: x.errorCode })),
      });
    }
    setSession({ ...session, results: nextResults, index: index + 1 });
  };

  return (
    <>
      <AppBar title={`Latihan L${level}`} back={`/modul/${id}`} meta={`Soal ${index + 1}/${questions.length}`} />
      <main className="page page--focus">
        <QuestionCard
          key={`${level}-${index}`}
          q={questions[index]}
          onAttempt={(d) => {
            progress.recordAnswer(id, { correct: d.correct, errorCode: d.errorCode });
            logActivity('latihan', { correct: d.correct ? 1 : 0, label: `Modul ${module.no} · Level ${level}` });
          }}
          onDone={onDone}
        />
      </main>
    </>
  );
}
