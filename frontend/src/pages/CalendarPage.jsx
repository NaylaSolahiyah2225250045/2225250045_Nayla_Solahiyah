import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ACTIVITY_TYPES, computeStreak, dateKey, useActivity } from '../lib/activity.js';
import Mascot from '../components/Mascot.jsx';
import MascotLive from '../components/MascotLive.jsx';
import Decor from '../components/Decor.jsx';
import { IconLeft, IconRight } from '../components/Icons.jsx';
import { IconCalendar } from '../components/NavIcons.jsx';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const monthName = (d) => d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
const longDate = (key) => new Date(`${key}T12:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** Cap kapibara untuk tanggal yang benar-benar dipakai belajar. */
function CapyStamp({ level }) {
  return (
    <span className={`capy-stamp capy-stamp--${level}`} aria-hidden="true">
      <Mascot variant="head" size={30} title="" />
      {level === 3 && <span className="capy-stamp__star">★</span>}
    </span>
  );
}

/** Tingkat cap: 1 = sedikit, 2 = sedang, 3 = banyak kegiatan. */
const stampLevel = (log) => {
  const total = Object.values(log).reduce((s, e) => s + e.count, 0);
  const kinds = Object.keys(log).length;
  return kinds >= 3 || total >= 20 ? 3 : kinds >= 2 || total >= 8 ? 2 : 1;
};

/** Kalender Belajar: cap kapibara pada tanggal belajar; tekan tanggal untuk melihat aktivitasnya. */
export default function CalendarPage() {
  const { days } = useActivity();
  const todayKey = dateKey();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => (days[todayKey] ? todayKey : null));

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7; // Senin = kolom pertama
  const count = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const monthKeys = Object.keys(days).filter((k) => k.startsWith(`${y}-${String(m + 1).padStart(2, '0')}-`));
  const sel = selected ? days[selected] : null;

  return (
    <main className="page page--wide stack">
      <header className="page-hero page-hero--install page-hero--decor">
        <Decor set="calendar" />
        <span className="page-hero__icon" aria-hidden="true">
          <IconCalendar />
        </span>
        <div className="page-hero__text">
          <h1>Kalender Belajar</h1>
          <p>Cap kapibara muncul di hari kamu benar-benar belajar: membaca materi, latihan, atau bereksperimen di Lab Koma.</p>
        </div>
        <div className="page-hero__mascot">
          <MascotLive poses={days[todayKey] ? ['happy', 'jump', 'wave'] : ['wave', 'point', 'think']} size={72} bubble="none" />
        </div>
      </header>

      <ul className="cal-stats">
        <li>
          <b>{monthKeys.length}</b> hari belajar bulan ini
        </li>
        <li>
          <b>{computeStreak(days, todayKey)}</b> hari berturut-turut
        </li>
        <li>
          <b>{Object.keys(days).length}</b> hari belajar total
        </li>
      </ul>

      <div className="cal-layout">
        <section className="cal card" aria-labelledby="cal-title">
          <div className="cal__head">
            <button type="button" className="icon-btn" onClick={() => setCursor(new Date(y, m - 1, 1))} aria-label="Bulan sebelumnya">
              <IconLeft />
            </button>
            <h2 id="cal-title">{monthName(cursor)}</h2>
            <button type="button" className="icon-btn" onClick={() => setCursor(new Date(y, m + 1, 1))} aria-label="Bulan berikutnya">
              <IconRight />
            </button>
          </div>
          <div className="cal__grid">
            {DAYS.map((d) => (
              <span key={d} className="cal__dow" aria-hidden="true">
                {d}
              </span>
            ))}
            {cells.map((day, i) => {
              if (!day) return <span key={`x${i}`} className="cal__cell cal__cell--empty" />;
              const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const log = days[key];
              const cls = ['cal__cell', log ? 'is-active' : '', key === todayKey ? 'is-today' : '', key === selected ? 'is-selected' : '', key > todayKey ? 'is-future' : '']
                .filter(Boolean)
                .join(' ');
              return log ? (
                <button
                  key={key}
                  type="button"
                  className={cls}
                  onClick={() => setSelected(key)}
                  aria-pressed={key === selected}
                  aria-label={`${longDate(key)}: ada kegiatan belajar. Tekan untuk melihat.`}
                >
                  <span className="cal__num">{day}</span>
                  <CapyStamp level={stampLevel(log)} />
                </button>
              ) : (
                <span key={key} className={cls}>
                  <span className="cal__num">{day}</span>
                </span>
              );
            })}
          </div>
          <p className="cal__legend small muted">
            <CapyStamp level={1} /> belajar sedikit <CapyStamp level={2} /> sedang <CapyStamp level={3} /> rajin sekali
          </p>
        </section>

        <section className="cal-detail card" aria-live="polite" aria-labelledby="cal-detail-title">
          {sel ? (
            <>
              <h2 id="cal-detail-title">{longDate(selected)}</h2>
              <ul className="cal-acts">
                {Object.entries(sel).map(([type, e]) => (
                  <li key={type} className={`cal-act cal-act--${type}`}>
                    <b>{ACTIVITY_TYPES[type]?.label ?? type}</b>
                    <span>
                      {e.count} {ACTIVITY_TYPES[type]?.unit}
                      {['latihan', 'kuis', 'ulang'].includes(type) ? ` · ${e.correct ?? 0} benar` : ''}
                    </span>
                    {e.labels.length > 0 && <span className="small muted">{e.labels.join(' · ')}</span>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="cal-empty">
              <h2 id="cal-detail-title">{Object.keys(days).length ? 'Pilih tanggal bercap kapibara' : 'Belum ada cap kapibara'}</h2>
              <p className="muted">
                {Object.keys(days).length
                  ? 'Tekan tanggal yang ada kapibaranya untuk melihat apa yang kamu pelajari hari itu.'
                  : 'Baca materi atau kerjakan latihan hari ini untuk mendapat cap pertamamu!'}
              </p>
              {!Object.keys(days).length && (
                <Link to="/materi" className="btn btn--primary">
                  Mulai belajar
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
