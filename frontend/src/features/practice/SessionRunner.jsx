import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AppBar from '../../components/AppBar.jsx';
import MascotLive from '../../components/MascotLive.jsx';
import QuestionCard from './QuestionCard.jsx';
import { progress } from '../../lib/progress.js';
import { logActivity } from '../../lib/activity.js';
import { recordSession } from '../../lib/history.js';
import { XP_PER_CORRECT } from '../../lib/rewards.js';

/**
 * Menjalankan satu sesi soal (titik jalur Latihan atau "coba lagi" dari Riwayat).
 * Setiap soal: satu kali jawab — bila salah, jawaban benar + penjelasan tampil di bawah soal.
 * Hasil dicatat ke progres modul, log aktivitas (Kalender), dan Riwayat Latihan.
 *
 * @param {{ questions: object[], title: string, kind: 'latihan'|'ulang', nodeId?: string|null,
 *   moduleId?: string|null, passCount?: number, backTo: string, onPassed?: () => void,
 *   next?: { to: string, label: string } | null, onRestart: () => void }} props
 */
export default function SessionRunner({ questions, title, kind, nodeId = null, moduleId = null, passCount, backTo, onPassed, next, onRestart, backLabel = 'Kembali ke jalur latihan' }) {
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState([]);
  const saved = useRef(false);
  const finished = index >= questions.length;
  const correct = items.filter((i) => i.correct).length;
  const passed = passCount === undefined ? correct === items.length : correct >= passCount;

  // Simpan hasil sekali saat sesi selesai (efek, bukan saat render).
  useEffect(() => {
    if (!finished || saved.current) return;
    saved.current = true;
    recordSession({ kind, nodeId, moduleId, title, items });
    if (passed) onPassed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (finished) {
    return (
      <>
        <AppBar title={title} back={backTo} />
        <main className="page page--focus stack session-end">
          <div className="session-end__mascot">
            <MascotLive
              poses={passed ? ['happy', 'jump', 'thumb'] : ['cheer', 'smile', 'point']}
              size={150}
              celebrate={passed}
              bubble="top"
              lines={[passed ? 'Hore, kamu berhasil!' : 'Tidak apa-apa, ayo coba lagi!']}
            />
          </div>
          <h2 className="session-end__title">{passed ? 'Latihan selesai!' : 'Hampir! Ayo coba sekali lagi'}</h2>
          <div className="session-end__score">
            <span>
              <b>
                {correct}/{items.length}
              </b>
              benar
            </span>
            <span>
              <b>+{correct * XP_PER_CORRECT}</b>XP
            </span>
            <span>
              <b>{Math.round((correct / items.length) * 100)}</b>nilai
            </span>
          </div>
          {passCount !== undefined && !passed && (
            <p className="muted center">
              Perlu {passCount} jawaban benar untuk membuka titik berikutnya. Baca pembahasan di Riwayat Latihan, lalu coba lagi.
            </p>
          )}
          <div className="stack-s">
            {passed && next && (
              <Link to={next.to} className="btn btn--primary btn--lg btn--block">
                {next.label}
              </Link>
            )}
            <button type="button" className={`btn btn--lg btn--block${passed && next ? ' btn--outline' : ' btn--primary'}`} onClick={onRestart}>
              Ulangi latihan ini
            </button>
            <Link to="/riwayat" className="btn btn--outline btn--block">
              Lihat pembahasan di Riwayat
            </Link>
            <Link to={backTo} className="btn btn--ghost btn--block">
              {backLabel}
            </Link>
          </div>
        </main>
      </>
    );
  }

  const q = questions[index];
  return (
    <>
      <AppBar title={title} back={backTo} total={questions.length} current={index} />
      <main className="page page--focus">
        <QuestionCard
          key={index}
          q={q}
          maxTries={1}
          onAttempt={(d) => {
            if (moduleId) progress.recordAnswer(moduleId, { correct: d.correct, errorCode: d.errorCode });
            logActivity(kind, { count: 1, correct: d.correct ? 1 : 0, label: title });
          }}
          onDone={(r) => {
            setItems((list) => [...list, { q, response: r.response, correct: r.correct, errorCode: r.errorCode }]);
            setIndex((i) => i + 1);
          }}
        />
      </main>
    </>
  );
}
