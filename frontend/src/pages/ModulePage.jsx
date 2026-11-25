import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getModule } from '../content/modules.js';
import { getModuleProgress, progress } from '../lib/progress.js';
import { logActivity } from '../lib/activity.js';
import LessonItem from '../features/lessons/LessonItem.jsx';
import Mascot, { Logo } from '../components/Mascot.jsx';
import { IconBack, IconCheck } from '../components/Icons.jsx';
import { IconArrowLeft, IconArrowRight } from '../components/NavIcons.jsx';
import AudioControl from '../components/AudioControl.jsx';

/** Bagian modul (daftar di panel kiri) dan label chip per tipe item. */
const SECTION_OF = {
  intro: 'Tujuan Pembelajaran',
  concept: 'Materi',
  worked: 'Contoh Soal',
  faded: 'Contoh Soal',
  guided: 'Langkah Terpandu',
  practice: 'Latihan Soal',
  quiz: 'Kuis',
};
const CHIP_OF = {
  intro: 'Tujuan Pembelajaran',
  concept: 'Materi',
  worked: 'Contoh Soal',
  faded: 'Contoh Setengah Jadi',
  guided: 'Langkah Terpandu',
  practice: 'Latihan Soal',
  quiz: 'Kuis',
};
const CHIP_ICON = { worked: '💡', faded: '✏️', guided: '🧭', practice: '📝', quiz: '🏁', concept: '📘', intro: '🎯' };

/** Pemutar materi: satu item per layar, siswa mengatur tempo sendiri. */
export default function ModulePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const module = getModule(id);
  const [params] = useSearchParams();
  const [index, setIndex] = useState(() => {
    // ?i=3 membuka langsung layar ke-4 (tautan dari guru / pengujian)
    const fromUrl = Number.parseInt(params.get('i') ?? '', 10);
    const saved = Number.isInteger(fromUrl) ? fromUrl : getModuleProgress(id).lastItem;
    return module && saved >= 0 && saved < module.items.length ? saved : 0;
  });
  const topRef = useRef(null);
  const firstView = useRef(true);

  // Bagian unik sesuai urutan kemunculan pertama; satu bagian bisa muncul di beberapa tempat
  // (mis. materi "Cara cepat" setelah contoh soal), jadi simpan semua indeksnya.
  const sections = useMemo(() => {
    if (!module) return [];
    const byName = new Map();
    module.items.forEach((it, i) => {
      const name = SECTION_OF[it.type];
      if (!byName.has(name)) byName.set(name, { name, indexes: [] });
      byName.get(name).indexes.push(i);
    });
    return [...byName.values()];
  }, [module]);

  useEffect(() => {
    if (module) progress.setPosition(id, index);
    if (module && !firstView.current) logActivity('modul', { label: `Topik ${module.no} · ${module.short}` });
    firstView.current = false;
    window.scrollTo({ top: 0 });
    topRef.current?.focus({ preventScroll: true });
  }, [id, index, module]);

  if (!module || module.comingSoon) return <Navigate to="/beranda" replace />;
  if (module.id !== id) return <Navigate to={`/modul/${module.id}`} replace />; // tautan modul lama → topik

  const total = module.items.length;
  const item = module.items[index];
  const last = index === total - 1;
  const pct = Math.round(((index + 1) / total) * 100);

  return (
    <div className="lesson-shell">
      <header className="lesson-top">
        <Link to="/beranda" className="lesson-top__brand" aria-label="NoBaku, ke beranda">
          <Logo size={44} />
        </Link>
        <button type="button" className="icon-btn lesson-top__back" onClick={() => navigate('/beranda')} aria-label="Kembali ke Dashboard">
          <IconBack />
        </button>
        <p className="lesson-top__title">{module.title}</p>
        <AudioControl />
        <Link to="/beranda" className="btn btn--outline btn--sm lesson-top__home">
          <IconArrowLeft /> Kembali ke Dashboard
        </Link>
      </header>

      <div className="lesson-layout">
        <aside className="lesson-aside" aria-label="Isi modul">
          <p className="small muted">Topik {module.no}</p>
          <h1 className="lesson-aside__title">{module.title}</h1>
          <p className="small">
            <b>{pct}%</b> Selesai
          </p>
          <span className="meter" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </span>
          <ol className="section-list">
            {sections.map((s) => {
              const state = s.name === SECTION_OF[item.type] ? 'current' : s.indexes.every((i) => i < index) ? 'done' : 'todo';
              return (
                <li key={s.name}>
                  <button
                    type="button"
                    className={`section-list__btn is-${state}`}
                    aria-current={state === 'current' ? 'step' : undefined}
                    onClick={() => setIndex(s.indexes[0])}
                  >
                    <span className="section-list__dot">{state === 'done' ? <IconCheck /> : null}</span>
                    {s.name}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="lesson-main">
          <div className="lesson-progress-mobile" aria-hidden="true">
            <span className="meter">
              <span style={{ width: `${pct}%` }} />
            </span>
            <span className="small muted">
              {index + 1}/{total}
            </span>
          </div>
          <article className="lesson-card" ref={topRef} tabIndex={-1}>
            <div className="lesson-card__head">
              <span className="chip chip--yellow lesson-card__chip">
                <span aria-hidden="true">{CHIP_ICON[item.type]}</span> {CHIP_OF[item.type]}
              </span>
              {/* Maskot kecil statis untuk layar < 1240px; di layar lebar maskot tampil di samping kartu. */}
              <span className="lesson-card__mascot" aria-hidden="true">
                <Mascot variant="head" size={52} title="" />
              </span>
            </div>
            <LessonItem key={`${id}-${index}`} item={item} module={module} />
          </article>
          <nav className="lesson-nav" aria-label="Navigasi materi">
            <button type="button" className="btn btn--outline" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
              <IconArrowLeft /> Sebelumnya
            </button>
            <button type="button" className="btn btn--primary" onClick={() => (last ? navigate('/beranda') : setIndex((i) => i + 1))}>
              {last ? 'Selesai' : 'Selanjutnya'} <IconArrowRight />
            </button>
          </nav>
        </main>

        <div className="lesson-mascot" aria-hidden="true">
          <Mascot variant="thumb" size={150} title="" />
        </div>
      </div>
    </div>
  );
}
