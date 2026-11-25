import { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { getModule, MODULES } from '../content/modules.js';
import { BANK, FINAL_QUIZ } from '../content/bank.js';
import { errorLabel, MASCOT_LINES } from '../content/messages.js';
import MascotLive from '../components/MascotLive.jsx';
import { progress } from '../lib/progress.js';
import { logActivity } from '../lib/activity.js';
import { recordSession } from '../lib/history.js';
import { FINAL_ID, FINAL_NODE_ID } from '../lib/path.js';
import { explanationFor, promptText } from '../lib/sci/index.js';
import { playSfx } from '../lib/audio.js';
import AppBar from '../components/AppBar.jsx';
import QuestionCard, { KeyView, QuestionValue } from '../features/practice/QuestionCard.jsx';
import PaasScale from '../components/PaasScale.jsx';
import Feedback from '../components/Feedback.jsx';
import { goalFor } from '../lib/rmt.js';

/**
 * Kuis: kuis satu topik (#/modul/:id/kuis) atau Level 5 · Kuis Akhir (#/kuis-akhir, prop `final`).
 * Soal dikerjakan tanpa petunjuk; nilai, nilai per topik (Kuis Akhir), dan pembahasan tampil di akhir.
 */
export default function QuizPage({ final = false }) {
  const { id: rawId } = useParams();
  const module = final ? null : getModule(rawId);
  const id = final ? FINAL_ID : module?.id;
  const [phase, setPhase] = useState('intro'); // intro | answering | result | survey | done
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [paas, setPaas] = useState(null);
  const [params] = useSearchParams();

  if (!final && (!module || !BANK[module.id])) return <Navigate to="/beranda" replace />;
  if (!final && module.id !== rawId) return <Navigate to={`/modul/${module.id}/kuis`} replace />;

  const questions = final ? FINAL_QUIZ : BANK[id].quiz;
  const name = final ? 'Kuis Akhir' : `Kuis Topik ${module.no}`;
  const short = final ? 'Level 5 · Kuis Akhir' : `Kuis · ${module.short}`;
  const backTo = final || params.get('dari') === 'latihan' ? '/latihan' : `/modul/${id}`;

  if (phase === 'intro') {
    // RMT (Intensionalitas & Makna): tujuan & alasan penting di layar pembuka kuis yang sudah ada.
    const goal = goalFor({ kind: final ? 'final' : 'quiz', topicId: id });
    return (
      <>
        <AppBar title={short} back={backTo} />
        <main className="page page--focus stack">
          <h2>{final ? 'Level 5 · Kuis Akhir' : name}</h2>
          <p className="lead">
            {final
              ? `${questions.length} soal dari kelima topik materi. Kerjakan sendiri tanpa petunjuk. Nilai, hasil per topik, dan pembahasan muncul di akhir.`
              : `${questions.length} soal tanpa petunjuk. Kerjakan sendiri, ya. Hasil dan pembahasan muncul di akhir.`}
          </p>
          {goal && (
            <div className="goal-card">
              <p>
                <b>Tujuan:</b> {goal.goal}
              </p>
              <p>
                <b>Kenapa penting?</b> {goal.why}
              </p>
            </div>
          )}
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
      logActivity('kuis', { correct: r.correct ? 1 : 0, label: name });
      const next = [...results, r];
      setResults(next);
      if (index + 1 >= questions.length) {
        const score = Math.round((next.filter((x) => x.correct).length / questions.length) * 100);
        progress.finishQuiz(id, score);
        recordSession({
          kind: 'kuis',
          nodeId: final ? FINAL_NODE_ID : `${id}-kuis`,
          moduleId: id,
          title: name,
          items: next.map((x, i) => ({ q: questions[i], response: x.response, correct: x.correct, errorCode: x.errorCode })),
        });
        setPhase('result');
        playSfx('quiz');
      } else setIndex(index + 1);
    };
    return (
      <>
        <AppBar title={short} back={backTo} total={questions.length} current={index} />
        <main className="page page--focus">
          <QuestionCard key={index} q={questions[index]} mode="quiz" onDone={onDone} />
        </main>
      </>
    );
  }

  const correct = results.filter((r) => r.correct).length;
  const score = Math.round((correct / questions.length) * 100);

  if (phase === 'result') {
    // Kuis Akhir: hasil per topik agar siswa tahu topik mana yang perlu diulang.
    const perTopic = final
      ? MODULES.map((m) => {
          const idx = questions.map((q, i) => (q.topic === m.no ? i : -1)).filter((i) => i >= 0);
          return { m, total: idx.length, ok: idx.filter((i) => results[i]?.correct).length };
        })
      : [];
    return (
      <>
        <AppBar title={final ? 'Hasil Kuis Akhir' : 'Hasil kuis'} back={backTo} />
        <main className="page page--focus stack">
          <div className="card card--hero stack-s">
            <p className="muted">{final ? 'Nilai Kuis Akhir' : 'Skor kuis'}</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800 }}>{score}</p>
            <p>
              {correct} dari {questions.length} soal benar
            </p>
          </div>
          {final && (
            <section className="card stack-s" aria-labelledby="per-topik">
              <h2 id="per-topik">Hasil per topik</h2>
              <ul className="topic-score">
                {perTopic.map(({ m, total, ok }) => (
                  <li key={m.id}>
                    <span>
                      Topik {m.no} · {m.short}
                    </span>
                    <b className={ok === total ? 'c-ok' : undefined}>
                      {ok}/{total}
                    </b>
                  </li>
                ))}
              </ul>
              {perTopic.some((t) => t.ok < t.total) && <p className="small muted">Ulangi materi topik yang belum penuh nilainya di menu Materi.</p>}
            </section>
          )}
          <h2>Pembahasan</h2>
          <ol className="stack-s" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {questions.map((q, i) => (
              <li key={i} className="card stack-s">
                <div className="row row--between">
                  <strong>
                    Soal {i + 1}
                    {final && q.topic ? <span className="small muted"> · Topik {q.topic}</span> : null}
                  </strong>
                  <span className={`badge ${results[i]?.correct ? 'badge--ok' : 'badge--bad'}`}>{results[i]?.correct ? 'Benar' : 'Belum tepat'}</span>
                </div>
                <p className={q.text ? undefined : 'small muted'}>{promptText(q)}</p>
                {q.type !== 'choose_correct' && <QuestionValue q={q} />}
                <p>
                  Jawaban benar: <KeyView q={q} />
                </p>
                {!results[i]?.correct && results[i]?.errorCode && (
                  <p className="small muted">Yang perlu diperhatikan: {errorLabel[results[i].errorCode]}</p>
                )}
                <details className="quiz-steps">
                  <summary>Lihat langkah penyelesaian</summary>
                  <ol className="steps steps--compact">
                    {explanationFor(q).map((s) => (
                      <li key={s}>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </details>
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
      <AppBar title={final ? 'Kuis Akhir selesai' : 'Topik selesai'} back="/beranda" />
      <main className="page page--focus stack">
        {/* Layar selesai (bukan area soal): maskot merayakan dengan bintang. */}
        <div className="done-stage">
          <MascotLive poses={['happy', 'jump', 'thumb']} size={170} lines={MASCOT_LINES.done} bubble="top" celebrate />
        </div>
        <Feedback kind="ok" title={final ? `Kuis Akhir selesai! Nilaimu ${score}.` : `Topik ${module.no} selesai!`}>
          <p>
            {final
              ? 'Hasilnya tersimpan di Riwayat Latihan dan Profil. Kamu bisa mengerjakannya lagi kapan saja.'
              : 'Terima kasih sudah belajar. Kamu bisa mengulang materi atau latihan kapan saja.'}
          </p>
        </Feedback>
        <Link to={final ? '/riwayat' : '/beranda'} className="btn btn--primary btn--block">
          {final ? 'Lihat di Riwayat Latihan' : 'Kembali ke Dashboard'}
        </Link>
        <Link to={final ? '/latihan' : '/progres'} className="btn btn--block">
          {final ? 'Kembali ke Jalur Latihan' : 'Lihat progres'}
        </Link>
      </main>
    </>
  );
}
