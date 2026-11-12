import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHistory, wrongItems } from '../lib/history.js';
import { explanationFor, promptText, responseText } from '../lib/sci/index.js';
import { ERROR_MESSAGES } from '../content/messages.js';
import { KeyView, QuestionValue } from '../features/practice/QuestionCard.jsx';
import MascotLive from '../components/MascotLive.jsx';
import Decor from '../components/Decor.jsx';
import { IconHistory } from '../components/NavIcons.jsx';
import { IconCheck, IconX } from '../components/Icons.jsx';

const KIND = { latihan: 'Latihan', kuis: 'Kuis', ulang: 'Coba lagi' };

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function SessionDetail({ s }) {
  return (
    <ol className="hist-items">
      {s.items.map((it, i) => (
        <li key={i} className={`hist-item ${it.correct ? 'is-ok' : 'is-bad'}`}>
          <div className="hist-item__head">
            <span className="hist-item__no">Soal {i + 1}</span>
            <span className={`badge ${it.correct ? 'badge--ok' : 'badge--bad'}`}>{it.correct ? 'Benar' : 'Salah'}</span>
          </div>
          <p className="small muted">{promptText(it.q)}</p>
          {it.q.type === 'choose_correct' ? <p>{it.q.text}</p> : <QuestionValue q={it.q} />}
          <dl className="hist-item__answers">
            <div>
              <dt>Jawabanmu</dt>
              <dd className="sci">{responseText(it.q, it.response)}</dd>
            </div>
            <div>
              <dt>Jawaban benar</dt>
              <dd>
                <KeyView q={it.q} />
              </dd>
            </div>
          </dl>
          {!it.correct && (
            <details className="hist-item__explain" open>
              <summary>Penjelasan</summary>
              {it.errorCode && ERROR_MESSAGES[it.errorCode] && (
                <p className="small">
                  <b>{ERROR_MESSAGES[it.errorCode].title}.</b> {ERROR_MESSAGES[it.errorCode].text}
                </p>
              )}
              <ol>
                {explanationFor(it.q).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </details>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Riwayat Latihan: hasil sesi, jawaban siswa vs benar, nilai, penjelasan, dan coba lagi soal yang salah. */
export default function HistoryPage() {
  const { sessions } = useHistory();
  const [openId, setOpenId] = useState(sessions[0]?.id ?? null);
  const totalWrong = sessions.reduce((s, x) => s + wrongItems(x).length, 0);

  return (
    <main className="page page--wide stack">
      <header className="page-hero page-hero--progress page-hero--decor">
        <Decor set="history" />
        <span className="page-hero__icon" aria-hidden="true">
          <IconHistory />
        </span>
        <div className="page-hero__text">
          <h1>Riwayat Latihan</h1>
          <p>Lihat lagi jawabanmu, pelajari pembahasannya, lalu coba lagi soal yang salah.</p>
        </div>
        <div className="page-hero__mascot">
          <MascotLive poses={totalWrong ? ['cheer', 'point', 'smile'] : ['happy', 'thumb', 'wink']} size={72} bubble="none" />
        </div>
      </header>

      {sessions.length === 0 ? (
        <div className="empty card">
          <p className="empty__title">Belum ada riwayat latihan</p>
          <p className="muted">Kerjakan satu titik di jalur Latihan. Hasilnya akan tersimpan di sini.</p>
          <Link to="/latihan" className="btn btn--primary">
            Mulai latihan
          </Link>
        </div>
      ) : (
        <>
          <ul className="hist-summary">
            <li>
              <b>{sessions.length}</b> sesi
            </li>
            <li>
              <b>{sessions.reduce((s, x) => s + x.total, 0)}</b> soal dikerjakan
            </li>
            <li className={totalWrong ? 'is-bad' : ''}>
              <b>{totalWrong}</b> soal perlu diulang
            </li>
          </ul>
          <ul className="hist-list">
            {sessions.map((s) => {
              const wrong = wrongItems(s).length;
              const isOpen = openId === s.id;
              return (
                <li key={s.id} className={`hist-card${isOpen ? ' is-open' : ''}`}>
                  <button type="button" className="hist-card__head" aria-expanded={isOpen} onClick={() => setOpenId(isOpen ? null : s.id)}>
                    <span className={`hist-score${s.score >= 60 ? ' is-ok' : ' is-bad'}`}>
                      <b>{s.score}</b>
                      <span>nilai</span>
                    </span>
                    <span className="hist-card__text">
                      <b>{s.title}</b>
                      <span className="small muted">
                        {KIND[s.kind]} · {fmtDate(s.at)} · {s.correct}/{s.total} benar
                      </span>
                    </span>
                    <span className="hist-card__icons" aria-hidden="true">
                      {wrong ? <IconX /> : <IconCheck />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="hist-card__body">
                      {wrong > 0 && (
                        <Link to={`/riwayat/ulang/${s.id}`} className="btn btn--cta btn--block">
                          Coba lagi {wrong} soal yang salah
                        </Link>
                      )}
                      <SessionDetail s={s} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
