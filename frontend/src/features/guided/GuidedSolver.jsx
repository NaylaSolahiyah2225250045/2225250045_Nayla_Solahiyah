import { useMemo, useState } from 'react';
import { shiftInfo, parseStandard, toScientific, diagnoseToScientific } from '../../lib/sci/index.js';
import { ERROR_MESSAGES } from '../../content/messages.js';
import NumberStrip from '../../components/NumberStrip.jsx';
import Feedback from '../../components/Feedback.jsx';
import { SciInput } from '../../components/AnswerInputs.jsx';
import { Sci } from '../../components/Sci.jsx';

const STEPS = [
  'Ketuk angka bukan nol pertama',
  'Ketuk celah tempat koma yang baru',
  'Berapa kali koma melompat?',
  'Ke mana koma melompat?',
  'Tulis bentuk bakunya',
];

const MAX_TRIES = 2;

/**
 * Langkah Terpandu (F-05): soal "tulis dalam bentuk baku" dikerjakan per sub-langkah.
 * Setiap langkah divalidasi; setelah 2 kali salah, jawabannya ditunjukkan lalu lanjut.
 */
export default function GuidedSolver({ value, onComplete }) {
  const info = useMemo(() => shiftInfo(value), [value]);
  const key = useMemo(() => toScientific(parseStandard(value)), [value]);
  const [step, setStep] = useState(0);
  const [tries, setTries] = useState(0);
  const [fb, setFb] = useState(null);
  const [wrongCell, setWrongCell] = useState(null);
  const [wrongGap, setWrongGap] = useState(null);
  const [jumps, setJumps] = useState('');
  const [answer, setAnswer] = useState({ a: '', n: '' });
  const [done, setDone] = useState(false);

  const absJumps = Math.abs(info.jumps);
  const goLeft = info.jumps > 0;

  const advance = (message) => {
    setFb(message ? { kind: 'ok', title: message } : null);
    setTries(0);
    setWrongCell(null);
    setWrongGap(null);
    setStep((s) => s + 1);
  };

  const fail = (title, text, reveal) => {
    const t = tries + 1;
    if (t >= MAX_TRIES) {
      setTries(0);
      setWrongCell(null);
      setWrongGap(null);
      setFb({ kind: 'info', title: 'Tidak apa-apa, ini jawabannya', text: reveal });
      setStep((s) => s + 1);
    } else {
      setTries(t);
      setFb({ kind: 'bad', title, text });
    }
  };

  const onCell = (i) => {
    if (step !== 0) return;
    if (i === info.firstIndex) advance(`Benar, angka bukan nol pertama adalah ${info.cells[i].d}.`);
    else {
      setWrongCell(i);
      fail(
        info.cells[i].d === '0' ? 'Itu angka nol' : 'Masih ada angka bukan nol di sebelah kirinya',
        'Mulai dari kiri. Lewati semua angka nol di depan.',
        `Angka bukan nol pertama adalah ${info.cells[info.firstIndex].d}.`,
      );
    }
  };

  const onGap = (g) => {
    if (step !== 1) return;
    if (g === info.targetComma) advance(`Tepat! Nilai a menjadi ${key.a}.`);
    else {
      setWrongGap(g);
      fail('Belum tepat', 'Koma ditaruh tepat SETELAH angka bukan nol pertama, supaya a di antara 1 dan 10.', `Koma ada tepat setelah ${info.cells[info.firstIndex].d}, jadi a = ${key.a}.`);
    }
  };

  const checkJumps = () => {
    const n = Number(String(jumps).trim());
    if (!String(jumps).trim()) return;
    if (n === absJumps) advance(`Ya, koma melompat ${absJumps} kali.`);
    else fail('Hitung lagi', 'Hitung celah yang dilewati koma, dari koma asal (samar) ke koma baru.', `Koma melompat ${absJumps} kali.`);
  };

  const chooseDir = (left) => {
    if (left === goLeft) advance(left ? 'Benar, ke kiri → pangkat positif.' : 'Benar, ke kanan → pangkat negatif.');
    else
      fail(
        'Coba lagi',
        'Bandingkan posisi koma asal dan koma baru. Bilangan kurang dari 1 → koma ke kanan.',
        goLeft ? 'Koma melompat ke kiri, jadi pangkatnya positif.' : 'Koma melompat ke kanan, jadi pangkatnya negatif.',
      );
  };

  const checkFinal = () => {
    if (!String(answer.a).trim() || !String(answer.n).trim()) return;
    const d = diagnoseToScientific(value, answer);
    if (d.correct) {
      setDone(true);
      setFb({ kind: 'ok', title: 'Hebat! Kamu menyelesaikan semua langkah.' });
      onComplete?.(true);
      return;
    }
    const m = ERROR_MESSAGES[d.errorCode] ?? ERROR_MESSAGES['E-LAIN'];
    const t = tries + 1;
    if (t >= MAX_TRIES) {
      setDone(true);
      setFb({ kind: 'info', title: 'Ini jawabannya', text: null });
      onComplete?.(false);
    } else {
      setTries(t);
      setFb({ kind: 'bad', title: m.title, text: m.text });
    }
  };

  const showComma = step >= 2 ? info.targetComma : info.originalComma;

  return (
    <div className="stack">
      <div className="card stack-s">
        <p className="muted">Tulis dalam bentuk baku, langkah demi langkah:</p>
        <p className="big-number">{value}</p>
      </div>

      <ol className="steps" aria-label="Langkah">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step && !done ? 'is-active' : i > step ? 'is-dim' : ''} aria-current={i === step ? 'step' : undefined}>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <div className="viz">
        <NumberStrip
          // Langkah 1: semua angka tampil netral agar warna nol tidak membocorkan jawaban.
          cells={step === 0 ? info.cells.map((c) => ({ ...c, kind: 'sig' })) : info.cells}
          comma={showComma}
          ghostComma={step >= 2 ? info.originalComma : null}
          trail={step >= 2 ? { from: info.originalComma, to: info.targetComma } : null}
          positions={step >= 2 && !goLeft}
          highlightFirst={step >= 1}
          markZeros={step >= 4}
          onCellClick={step === 0 ? onCell : undefined}
          onGapClick={step === 1 ? onGap : undefined}
          wrongCell={wrongCell}
          wrongGap={wrongGap}
          label={`Bilangan ${value}`}
        />
      </div>

      {step === 2 && (
        <div className="row">
          <label htmlFor="jumps" className="lead">
            Lompatan:
          </label>
          <input
            id="jumps"
            className="field field--small"
            inputMode="numeric"
            value={jumps}
            onChange={(e) => setJumps(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && checkJumps()}
          />
          <button type="button" className="btn btn--primary" onClick={checkJumps}>
            Cek
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="choice-row">
          <button type="button" className="btn" onClick={() => chooseDir(true)}>
            ← Ke kiri <span className="c-pos">(+)</span>
          </button>
          <button type="button" className="btn" onClick={() => chooseDir(false)}>
            Ke kanan <span className="c-neg">(−)</span> →
          </button>
        </div>
      )}

      {step === 4 && !done && (
        <div className="stack-s">
          <SciInput value={answer} onChange={setAnswer} onEnter={checkFinal} />
          <button type="button" className="btn btn--primary btn--block" onClick={checkFinal}>
            Cek jawaban
          </button>
        </div>
      )}

      {fb && (
        <Feedback kind={fb.kind} title={fb.title}>
          {fb.text && <p>{fb.text}</p>}
          {done && (
            <p>
              {value} = <Sci a={key.a} n={key.n} />
            </p>
          )}
        </Feedback>
      )}
    </div>
  );
}
