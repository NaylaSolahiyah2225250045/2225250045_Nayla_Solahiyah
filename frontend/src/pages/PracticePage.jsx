import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getModule } from '../content/modules.js';
import { BANK, isPassed, LEVEL_NAMES, LEVELS, PASS_COUNT, PER_SESSION } from '../content/bank.js';
import { practiceNodeId } from '../lib/path.js';
import { progress, useProgress, getModuleProgress } from '../lib/progress.js';
import { logActivity } from '../lib/activity.js';
import { recordSession } from '../lib/history.js';
import AppBar from '../components/AppBar.jsx';
import QuestionCard from '../features/practice/QuestionCard.jsx';
import Feedback from '../components/Feedback.jsx';
import { IconLock } from '../components/Icons.jsx';
import { playSfx } from '../lib/audio.js';

/** `key={id}`: berpindah topik selalu memulai ulang dengan soal topik itu (23 Nov 2026). */
export default function PracticePage() {
  const { id } = useParams();
  return <TopicPractice key={id} id={id} />;
}

function TopicPractice({ id }) {
  const module = getModule(id);
  useProgress();
  const [session, setSession] = useState(null); // {level, questions, index, results}

  if (!module || !BANK[module.id]) return <Navigate to="/beranda" replace />;
  if (module.id !== id) return <Navigate to={`/modul/${module.id}/latihan`} replace />; // tautan modul lama → topik
  const mp = getModuleProgress(id);

  // Urutan tetap (mudah → sedang → sulit), tidak diacak — 23 Nov 2026.
  const start = (level) => setSession({ level, questions: BANK[id].levels[level].slice(0, PER_SESSION), index: 0, results: [] });

  // ---------- Pilih level ----------
  if (!session) {
    return (
      <>
        <AppBar title={`Latihan · ${module.short}`} back={`/modul/${id}`} />
        <main className="page page--focus stack">
          <h2>Latihan topik</h2>
          <p className="muted">
            {PER_SESSION} soal berurutan dari mudah ke sulit. Lulus bila minimal {PASS_COUNT} jawabanmu benar.
          </p>
          <div className="levels">
            {LEVELS.map((l) => {
              const locked = l.level > Math.max(1, mp.levelUnlocked);
              return (
                <button key={l.level} type="button" className="level" disabled={locked} onClick={() => start(l.level)}>
                  <span className="row row--between">
                    <span className="level__name">{PER_SESSION} soal</span>
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
    const passed = isPassed(correct, questions.length);
    return (
      <>
        <AppBar title={`Latihan · ${module.short}`} back={`/modul/${id}`} />
        <main className="page page--focus stack">
          <h2>Hasil latihan</h2>
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
            <Feedback kind="ok" title="Kamu menuntaskan latihan topik ini!">
              <p>Saatnya mengerjakan kuis topik ini.</p>
            </Feedback>
          ) : (
            <Feedback kind="info" title="Ayo coba sekali lagi">
              <p>Kamu perlu {PASS_COUNT} jawaban benar. Lihat lagi contoh terurai di materi bila perlu.</p>
            </Feedback>
          )}
          <div className="stack-s">
            <button type="button" className={`btn btn--block${passed ? '' : ' btn--primary'}`} onClick={() => start(level)}>
              Ulangi latihan
            </button>
            <Link to={`/modul/${id}/kuis`} className={`btn btn--block${passed ? ' btn--primary' : ' btn--ghost'}`}>
              Ke kuis topik
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
      if (isPassed(correct, questions.length)) {
        progress.markPracticeDone(id);
        setTimeout(() => playSfx('level'), 450);
      }
      recordSession({
        kind: 'latihan',
        nodeId: practiceNodeId(id),
        moduleId: id,
        title: `Topik ${module.no} · ${LEVEL_NAMES[level]}`,
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
            logActivity('latihan', { correct: d.correct ? 1 : 0, label: `Topik ${module.no} · Latihan` });
          }}
          onDone={onDone}
        />
      </main>
    </>
  );
}
