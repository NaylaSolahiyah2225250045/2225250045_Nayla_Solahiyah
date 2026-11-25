import { Link } from 'react-router-dom';
import Decor from '../../components/Decor.jsx';
import MascotLive from '../../components/MascotLive.jsx';

/** Kartu angka ringkas (Dashboard Guru). */
export function StatTile({ label, value, note, tone = 'learn' }) {
  return (
    <div className={`t-stat t-stat--${tone}`}>
      <span className="t-stat__label">{label}</span>
      <b className="t-stat__value">{value}</b>
      {note && <span className="t-stat__note small">{note}</span>}
    </div>
  );
}

/**
 * Grafik batang mendatar satu seri (satu warna, tanpa legenda — judul grafik menamai serinya).
 * Setiap batang diberi label teks & nilai yang terlihat; `title` sebagai tooltip saat disorot.
 * @param {{ items: {label: string, value: number, max?: number, display?: string}[], max?: number, caption?: string }} p
 */
export function BarList({ items, max, caption, unit = '' }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <figure className="t-bars">
      <ul>
        {items.map((i) => {
          const pct = top ? Math.round((i.value / (i.max ?? top)) * 100) : 0;
          const shown = i.display ?? `${i.value}${unit}`;
          return (
            <li key={i.label} title={`${i.label}: ${shown}`}>
              <span className="t-bars__label">{i.label}</span>
              <span className="t-bars__track" aria-hidden="true">
                <span className="t-bars__fill" style={{ width: `${Math.max(pct, i.value > 0 ? 3 : 0)}%` }} />
              </span>
              <span className="t-bars__value">{shown}</span>
            </li>
          );
        })}
      </ul>
      {caption && <figcaption className="small muted">{caption}</figcaption>}
    </figure>
  );
}

/** Meter progres kecil dengan label tersembunyi untuk pembaca layar. */
export function Meter({ value, max, label }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <span className="t-meter" role="img" aria-label={label ?? `${value} dari ${max}`}>
      <span style={{ width: `${pct}%` }} />
    </span>
  );
}

/** Pilihan kelas (chip). `value` = id kelas atau 'semua'. */
export function ClassFilter({ classes, value, onChange, allowAll = true }) {
  return (
    <div className="t-filter" role="group" aria-label="Pilih kelas">
      {allowAll && (
        <button type="button" aria-pressed={value === 'semua'} onClick={() => onChange('semua')}>
          Semua kelas
        </button>
      )}
      {classes.map((c) => (
        <button key={c.klass.id} type="button" aria-pressed={value === c.klass.id} onClick={() => onChange(c.klass.id)}>
          {c.klass.name}
        </button>
      ))}
    </div>
  );
}

/** Kepala halaman Dashboard Guru (memakai gaya page-hero yang sama dengan Dashboard Siswa). */
export function TeacherHero({ tone = 'learn', Icon, title, text, children, decor = 'kelas', poses = ['smile', 'point', 'thumb'] }) {
  return (
    <header className={`page-hero page-hero--${tone} page-hero--decor t-hero`}>
      <Decor set={decor} />
      {Icon && (
        <span className="page-hero__icon" aria-hidden="true">
          <Icon />
        </span>
      )}
      <div className="page-hero__text">
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {children && <div className="page-hero__aside">{children}</div>}
      <div className="page-hero__mascot">
        <MascotLive poses={poses} size={72} bubble="none" />
      </div>
    </header>
  );
}

/** Keadaan kosong / galat / memuat yang konsisten. */
export function DataState({ loading, error, onRetry, empty, emptyText, emptyAction }) {
  if (loading) return <p className="muted">Memuat data kelas…</p>;
  if (error)
    return (
      <div className="card stack-s" role="alert">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="btn btn--sm" onClick={onRetry}>
            Coba lagi
          </button>
        )}
      </div>
    );
  if (empty)
    return (
      <div className="card stack-s t-empty">
        <p>{emptyText}</p>
        {emptyAction && (
          <Link to={emptyAction.to} className="btn btn--primary btn--sm">
            {emptyAction.label}
          </Link>
        )}
      </div>
    );
  return null;
}
