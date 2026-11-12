import { Link } from 'react-router-dom';
import { MODULES } from '../content/modules.js';
import { getModuleProgress } from '../lib/progress.js';
import { IconCheck, IconLock } from './Icons.jsx';

export function moduleStatus(m) {
  if (m.comingSoon) return { label: 'Segera hadir', done: false, pct: 0 };
  const p = getModuleProgress(m.id);
  if (p.completed) return { label: `Selesai · skor kuis ${p.bestQuiz}`, done: true, pct: 100, score: p.bestQuiz };
  if (p.maxItem > 0) {
    const pct = Math.round(((p.maxItem + 1) / m.items.length) * 100);
    return { label: `Sedang dipelajari · ${pct}%`, done: false, pct };
  }
  return { label: m.short, done: false, pct: 0 };
}

/** Daftar modul (beranda & halaman Modul Belajar). Komponen pemanggil harus berlangganan useProgress(). */
export default function ModuleList({ path = false }) {
  return (
    <ul className={`module-list${path ? " module-list--path" : ""}`}>
      {MODULES.map((m) => {
        const s = moduleStatus(m);
        const inner = (
          <>
            <span className={`module-item__num${s.done ? ' is-done' : ''}`}>{s.done ? <IconCheck /> : m.no}</span>
            <span className="module-item__body">
              <span className="module-item__title">{m.title}</span>
              <span className="small muted">{s.label}</span>
              {!m.comingSoon && s.pct > 0 && !s.done && (
                <span className="meter" aria-hidden="true">
                  <span style={{ width: `${s.pct}%` }} />
                </span>
              )}
            </span>
            {m.comingSoon && <IconLock />}
          </>
        );
        return (
          <li key={m.id}>
            {m.comingSoon ? (
              <div className="module-item is-locked" aria-disabled="true">
                {inner}
              </div>
            ) : (
              <Link to={`/modul/${m.id}`} className="module-item">
                {inner}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
