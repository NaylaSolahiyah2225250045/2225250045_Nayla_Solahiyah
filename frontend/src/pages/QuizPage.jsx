import { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { getModule } from '../content/modules.js';
import { BANK } from '../content/bank.js';
import { errorLabel, MASCOT_LINES } from '../content/messages.js';
import MascotLive from '../components/MascotLive.jsx';
import { progress } from '../lib/progress.js';
import { logActivity } from '../lib/activity.js';
import { recordSession } from '../lib/history.js';
import AppBar from '../components/AppBar.jsx';
import QuestionCard, { KeyView, QuestionValue } from '../features/practice/QuestionCard.jsx';
import PaasScale from '../components/PaasScale.jsx';
import Feedback from '../components/Feedback.jsx';

export default function QuizPage() {
  const { id } = useParams();
  const module = getModule(id);
  const [phase, setPhase] = useState('intro'); // intro | answering | result | survey | done
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [paas, setPaas] = useState(null);
  const [params] = useSearchParams();
  const backTo = params.get('dari') === 'latihan' ? '/latihan' : `/modul/${id}`;

  if (!module || !BANK[id]) return <Navigate to="/beranda" replace />;
  const questions = BANK[id].quiz;

  if (phase === 'intro') {
    return (
      <>
        <AppBar title={`Kuis · ${module.short}`} back={backTo} />
        <main className="page page--focus stack">
          <h2>Kuis Modul {module.no}</h2>
          <p className="lead">{questions.length} soal tanpa petunjuk. Kerjakan sendiri, ya. Hasil dan pembahasan muncul di akhir.</p>
          <button type="button" className="btn btn--primary btn--block" onClick={() => setPhase('answering')}>
            Mulai
          </button>
        </main>
      </>
    );
  }

  if (phase === 'answering') {
    const onDone = (r) => {
      progress.recordAnswer(id, r);
      logActivity('kuis', { correct: r.correct ? 1 : 0, label: `Kuis Modul ${module.no}` });
      const next = [...results, r];
      setResults(next);
      if (index + 1 >= questions.length) {
        const score = Math.round((next.filter((x) => x.correct).length / questions.length) * 100);
        progress.finishQuiz(id, score);
        recordSession({
          kind: 'kuis',
          nodeId: `${id}-kuis`,
          moduleId: id,
          title: `Kuis Modul ${module.no}`,
          items: next.map((x, i) => ({ q: questions[i], response: x.response, correct: x.correct, errorCode: x.errorCode })),
        });
        setPhase('result');
      } else setIndex(index + 1);
    };
    return (
      <>
        <AppBar title={`Kuis · ${module.short}`} back={backTo} total={questions.length} current={index} />
        <main className="page page--focus">
          <QuestionCard key={index} q={questions[index]} mode="quiz" onDone={onDone} />
        </main>
      </>
    );
  }

  const correct = results.filter((r) => r.correct).length;
  const score = Math.round((correct / questions.length) * 100);

  if (phase === 'result') {
    return (
      <>
        <AppBar title="Hasil kuis" back={backTo} />
        <main className="page page--focus stack">
          <div className="card card--hero stack-s">
            <p className="muted">Skor kuis</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800 }}>{score}</p>
            <p>
              {correct} dari {questions.length} soal benar
            </p>
          </div>
          <h2>Pembahasan</h2>
          <ol className="stack-s" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {questions.map((q, i) => (
              <li key={i} className="card stack-s">
                <div className="row row--between">
                  <strong>Soal {i + 1}</strong>
                  <span className={`badge ${results[i]?.correct ? 'badge--ok' : 'badge--bad'}`}>{results[i]?.correct ? 'Benar' : 'Belum tepat'}</span>
                </div>
                {q.type === 'choose_correct' ? <p>{q.text}</p> : <QuestionValue q={q} />}
                <p>
                  Jawaban benar: <KeyView q={q} />
                </p>
                {!results[i]?.correct && results[i]?.errorCode && (
                  <p className="small muted">Yang perlu diperhatikan: {errorLabel[results[i].errorCode]}</p>
                )}
              </li>
            ))}
          </ol>
          <button type="button" className="btn btn--primary btn--block" onClick={() => setPhase('survey')}>
            Lanjut
          </button>
        </main>
      </>
    );
  }

  if (phase === 'survey') {
    return (
      <>
        <AppBar title="Satu pertanyaan lagi" back={null} />
        <main className="page page--focus stack">
          <PaasScale value={paas} onChange={setPaas} />
          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={paas === null}
            onClick={() => {
              progress.setPaas(id, paas);
              setPhase('done');
            }}
          >
            Kirim
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setPhase('done')}>
            Lewati
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <AppBar title="Modul selesai" back="/beranda" />
      <main className="page page--focus stack">
        {/* Layar selesai (bukan area soal): maskot merayakan dengan bintang. */}
        <div className="done-stage">
          <MascotLive poses={['happy', 'jump', 'thumb']} size={170} lines={MASCOT_LINES.done} bubble="top" celebrate />
        </div>
        <Feedback kind="ok" title={`Modul ${module.no} selesai!`}>
          <p>Terima kasih sudah belajar. Kamu bisa mengulang materi atau latihan kapan saja.</p>
        </Feedback>
        <Link to="/beranda" className="btn btn--primary btn--block">
          Kembali ke Dashboard
        </Link>
        <Link to="/progres" className="btn btn--block">
          Lihat progres
        </Link>
      </main>
    </>
  );
}
