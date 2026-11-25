import { useMemo, useState } from 'react';
import { answerKey, checkAnswer, explanationFor, hintsFor, operationText, promptText, responseText, visualValue } from '../../lib/sci/index.js';
import { ERROR_MESSAGES } from '../../content/messages.js';
import { SciInput, StandardInput, ExpInput, Options } from '../../components/AnswerInputs.jsx';
import { Sci, Pow10 } from '../../components/Sci.jsx';
import Feedback from '../../components/Feedback.jsx';
import HintPanel from '../../components/HintPanel.jsx';
import { playSfx } from '../../lib/audio.js';
import CommaVisualizer from '../../components/CommaVisualizer.jsx';
import BackVisualizer from '../../components/BackVisualizer.jsx';
import { mediationFor } from '../../lib/rmt.js';
import AssistantPanel from '../assistant/AssistantPanel.jsx';

/** Aturan umum (RMT — Transendensi): tampil SETELAH menjawab, di bawah pembahasan yang sudah ada. */
export function RuleBox({ rule }) {
  if (!rule) return null;
  return (
    <div className="rule-box">
      <p className="rule-box__title">Aturan umum</p>
      <p>{rule}</p>
      <p className="small muted">Aturan ini berlaku juga untuk soal lain yang sejenis.</p>
    </div>
  );
}

/** Jenis soal yang dijawab dengan kolom a × 10ⁿ. */
export const SCI_INPUT_TYPES = ['to_scientific', 'normalize', 'operation'];
const usesSci = (q) => SCI_INPUT_TYPES.includes(q.type);

const emptyResponse = (q) => (usesSci(q) ? { a: '', n: '' } : '');

const isEmpty = (q, r) => (usesSci(q) ? !String(r.a).trim() || !String(r.n).trim() : !String(r ?? '').trim());

/** Tampilan soal (bilangan yang ditanyakan). */
export function QuestionValue({ q }) {
  switch (q.type) {
    case 'to_scientific':
    case 'power_of_ten':
    case 'place_value':
      return <p className="big-number">{q.value}</p>;
    case 'normalize':
      return (
        <p className="big-number">
          <Sci a={q.a} n={q.n} />
        </p>
      );
    case 'operation':
      // Soal cerita: siswa menyusun modelnya sendiri dari kalimat soal (tanpa ekspresi siap pakai).
      return q.text ? null : (
        <p className="big-number big-number--expr" aria-label={operationText(q)}>
          (<Sci a={q.x.a} n={q.x.n} />) {q.op === 'kali' ? '×' : ':'} (<Sci a={q.y.a} n={q.y.n} />)
        </p>
      );
    case 'to_standard':
      return (
        <p className="big-number">
          <Sci a={q.a} n={q.n} />
        </p>
      );
    case 'ten_to_standard':
      return (
        <p className="big-number">
          <Pow10 n={q.n} />
        </p>
      );
    default:
      return null;
  }
}

/** Kunci jawaban dalam bentuk tampilan. */
export function KeyView({ q }) {
  const key = answerKey(q);
  switch (q.type) {
    case 'to_scientific':
    case 'normalize':
    case 'operation':
      return (
        <>
          <Sci a={key.a} n={key.n} />
          {q.unit ? ` ${q.unit}` : ''}
        </>
      );
    case 'power_of_ten':
      return <Pow10 n={key} />;
    case 'choose_correct':
      return <span className="sci">{q.options.find((o) => o.key === key)?.text}</span>;
    default:
      return <span className="sci">{key}</span>;
  }
}

/**
 * Satu soal dengan input, cek, umpan balik, petunjuk, dan pembahasan.
 * mode "practice": umpan balik langsung, maks `maxTries` percobaan, petunjuk tersedia.
 * mode "quiz": satu kali jawab, tanpa umpan balik (dinilai di akhir).
 * `topicId` (opsional): topik soal untuk memilih pertanyaan pemandu & aturan umum RMT (lib/rmt.js).
 */
export default function QuestionCard({ q, mode = 'practice', maxTries = 3, onAttempt, onDone, showPrompt = true, hints: hintsProp, topicId = null }) {
  const [response, setResponse] = useState(() => emptyResponse(q));
  const [tries, setTries] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [status, setStatus] = useState('answering'); // answering | correct | revealed
  const [diag, setDiag] = useState(null);
  const [nudge, setNudge] = useState(false);
  const [showVisual, setShowVisual] = useState(false);
  const hints = useMemo(() => hintsProp ?? hintsFor(q), [q, hintsProp]);
  const med = useMemo(() => mediationFor(q, topicId), [q, topicId]);
  const visual = visualValue(q);
  // Modul 5: soal "ke bentuk biasa" memakai visual lompatan balik (koma dari a ke tempat asal).
  const backViz = q.type === 'to_standard' && q.focus === 'back';
  const isQuiz = mode === 'quiz';
  const locked = status !== 'answering';

  const check = () => {
    if (locked) return;
    if (isEmpty(q, response)) {
      setNudge(true);
      return;
    }
    setNudge(false);
    const d = checkAnswer(q, response);
    const t = tries + 1;
    setTries(t);
    setDiag(d);
    onAttempt?.(d);
    if (isQuiz) {
      onDone?.({ correct: d.correct, errorCode: d.errorCode, response });
      return;
    }
    playSfx(d.correct ? 'correct' : 'wrong');
    if (d.correct) setStatus('correct');
    else if (t >= maxTries) setStatus('revealed');
  };

  const finish = () =>
    onDone?.({ correct: status === 'correct', tries, hintsUsed: hintsShown, errorCode: diag?.errorCode ?? null, response });

  const input = (() => {
    const common = { disabled: locked, onEnter: check };
    switch (q.type) {
      case 'to_scientific':
      case 'normalize':
      case 'operation':
        return <SciInput value={response} onChange={setResponse} {...common} />;
      case 'power_of_ten':
        return <ExpInput value={response} onChange={setResponse} {...common} />;
      case 'choose_correct':
        return <Options options={q.options} value={response} onChange={setResponse} disabled={locked} />;
      default:
        return <StandardInput value={response} onChange={setResponse} {...common} />;
    }
  })();

  const msg = diag && !diag.correct ? ERROR_MESSAGES[diag.errorCode] ?? ERROR_MESSAGES['E-LAIN'] : null;
  // Mode "revealOnWrong" (jalur Latihan): satu kali jawab; bila salah langsung tampil jawaban benar + penjelasan.

  return (
    <div className="stack">
      {showPrompt && (
        <div className="card stack-s">
          <p className="muted">{promptText(q)}</p>
          <QuestionValue q={q} />
        </div>
      )}

      {input}

      {nudge && <Feedback kind="info" title="Isi jawabanmu dulu, ya." />}

      {!isQuiz && status === 'answering' && msg && (
        <Feedback
          kind="bad"
          title={msg.title}
          action={
            visual && (
              <button type="button" className="btn btn--ghost" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => setShowVisual((v) => !v)}>
                {showVisual ? 'Sembunyikan visual' : backViz ? 'Lihat visual lompatan koma' : 'Lihat visual geser koma'}
              </button>
            )
          }
        >
          <p>{msg.text}</p>
          {msg.ask && (
            <p className="feedback__ask">
              <b>Coba pikirkan:</b> {msg.ask}
            </p>
          )}
          <p className="small muted">Percobaan {tries} dari {maxTries}.</p>
        </Feedback>
      )}

      {status === 'correct' && (
        <Feedback kind="ok" title="Tepat!">
          <p>
            Jawabanmu: <KeyView q={q} />
          </p>
        </Feedback>
      )}
      {status === 'correct' && <RuleBox rule={med?.rule} />}

      {status === 'revealed' && (
        <div className="explain" role="status" aria-live="polite">
          <p className="explain__title">Belum tepat — ayo pahami pembahasannya</p>
          <dl className="explain__answers">
            <div className="explain__row explain__row--bad">
              <dt>Jawabanmu</dt>
              <dd className="sci">{responseText(q, response)}</dd>
            </div>
            <div className="explain__row explain__row--ok">
              <dt>Jawaban benar</dt>
              <dd>
                <KeyView q={q} />
              </dd>
            </div>
          </dl>
          {msg && (
            <p className="explain__why">
              <b>{msg.title}.</b> {msg.text}
            </p>
          )}
          <p className="explain__label">Penjelasan langkah demi langkah</p>
          <ol className="explain__steps">
            {explanationFor(q).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {msg?.ask && (
            <p className="explain__ask">
              <b>Renungkan:</b> {msg.ask}
            </p>
          )}
          <RuleBox rule={med?.rule} />
        </div>
      )}

      {visual && !isQuiz && (showVisual || status === 'revealed') &&
        (backViz ? <BackVisualizer a={q.a} n={q.n} autoPlay /> : <CommaVisualizer value={visual} autoPlay />)}

      {!isQuiz && status === 'answering' && hints.length > 0 && (
        <HintPanel hints={hints} shown={hintsShown} guide={med?.guide} onShowMore={() => setHintsShown((h) => Math.min(hints.length, h + 1))} />
      )}

      <div className="row row--end">
        {status === 'answering' ? (
          <button type="button" className="btn btn--primary btn--block" onClick={check}>
            {isQuiz ? 'Simpan jawaban' : 'Cek jawaban'}
          </button>
        ) : (
          <button type="button" className="btn btn--primary btn--block" onClick={finish} autoFocus>
            Lanjut
          </button>
        )}
      </div>

      {/* Asisten Belajar (Groq lewat backend): hanya latihan, tidak di kuis; tidak tampil bila belum tersedia. */}
      {!isQuiz && <AssistantPanel q={q} topicId={topicId} />}
    </div>
  );
}
