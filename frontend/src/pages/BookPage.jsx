import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BOOK_PAGES, CHAPTERS } from '../content/book.js';
import BookPageView from '../features/book/BookPageView.jsx';
import MascotLive from '../components/MascotLive.jsx';
import Decor from '../components/Decor.jsx';
import ModuleList from '../components/ModuleList.jsx';
import { IconLeft, IconRight } from '../components/Icons.jsx';
import { IconBook } from '../components/NavIcons.jsx';
import { saveBookPage, useBook } from '../lib/learner.js';
import { logActivity } from '../lib/activity.js';
import { useProgress } from '../lib/progress.js';
import { useSettings } from '../lib/settings.js';

const FLIP_MS = 650;
const TOTAL = BOOK_PAGES.length;

/** true bila layar cukup lebar untuk dua halaman berdampingan. */
function useTwoUp() {
  const q = '(min-width: 1024px)';
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false);
  const [two, setTwo] = useState(get);
  useEffect(() => {
    const m = window.matchMedia?.(q);
    if (!m) return undefined;
    const on = () => setTwo(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return two;
}

/** Halaman yang terlihat untuk posisi `page`. Laptop: pasangan [genap, ganjil]; HP: satu halaman. */
const viewOf = (page, two) => (two ? [page - (page % 2), page - (page % 2) + 1] : [page]);

/** Materi: buku digital interaktif dengan animasi membalik halaman. */
export default function BookPage() {
  useProgress();
  const two = useTwoUp();
  const stored = useBook();
  const { animations } = useSettings();
  const [page, setPage] = useState(() => Math.min(stored.page ?? 0, TOTAL - 1));
  const [flip, setFlip] = useState(null); // { dir, from: number[], to: number[] }
  const timer = useRef(null);
  const swipe = useRef(null);

  const view = viewOf(page, two);
  const step = two ? 2 : 1;
  const firstOfView = view[0];
  const lastOfView = view[view.length - 1];
  const canPrev = firstOfView > 0;
  const canNext = lastOfView < TOTAL - 1;

  useEffect(() => () => clearTimeout(timer.current), []);

  const goTo = (target) => {
    const t = Math.max(0, Math.min(TOTAL - 1, target));
    const from = viewOf(page, two);
    const to = viewOf(t, two);
    if (to[0] === from[0] || flip) return;
    const dir = to[0] > from[0] ? 'next' : 'prev';
    setPage(t);
    const visible = to.filter((i) => i > 0 && i < TOTAL);
    saveBookPage(t, visible);
    if (!visible.length) return finishFlip(dir, from, to);
    const ch = CHAPTERS.find((c) => c.id === BOOK_PAGES[visible[visible.length - 1]]?.chapter);
    logActivity('materi', { count: visible.length, label: ch ? `Bab ${ch.no} · ${ch.title}` : 'Buku materi' });
    return finishFlip(dir, from, to);
  };

  function finishFlip(dir, from, to) {
    if (!animations) return;
    setFlip({ dir, from, to });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlip(null), FLIP_MS);
  }

  const next = () => canNext && goTo(firstOfView + step);
  const prev = () => canPrev && goTo(firstOfView - step);

  // Panah keyboard ← → untuk membalik halaman.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, [role="slider"]')) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse') return;
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) (dx < 0 ? next : prev)();
  };

  // Lapisan bawah & lembar yang sedang dibalik.
  let under = view;
  let leaf = null;
  if (flip && two) {
    const [fl, fr] = flip.from;
    const [tl, tr] = flip.to;
    if (flip.dir === 'next') {
      under = [fl, tr];
      leaf = { cls: 'bk-leaf--next-two', front: fr, frontSide: 'right', back: tl, backSide: 'left' };
    } else {
      under = [tl, fr];
      leaf = { cls: 'bk-leaf--prev-two', front: fl, frontSide: 'left', back: tr, backSide: 'right' };
    }
  } else if (flip) {
    if (flip.dir === 'next') {
      under = flip.to;
      leaf = { cls: 'bk-leaf--next-one', front: flip.from[0], frontSide: 'right' };
    } else {
      under = flip.from;
      leaf = { cls: 'bk-leaf--prev-one', front: flip.to[0], frontSide: 'right' };
    }
  }

  const label = two ? `Halaman ${firstOfView === 0 ? 'sampul' : firstOfView}${lastOfView < TOTAL ? `–${lastOfView}` : ''}` : page === 0 ? 'Sampul' : `Halaman ${page}`;
  const chapterStart = (id) => BOOK_PAGES.findIndex((p) => p.chapter === id);
  const pct = Math.round(((lastOfView + 1) / TOTAL) * 100);

  return (
    <main className="page page--wide page--book stack">
      {/* Laptop: kepala ringkas + daftar isi + buku + navigasi muat dalam satu layar (lihat pages.css). */}
      <div className="book-viewport stack">
      <header className="page-hero page-hero--learn page-hero--decor book-hero">
        <Decor set="book" />
        <span className="page-hero__icon" aria-hidden="true">
          <IconBook />
        </span>
        <div className="page-hero__text">
          <h1>Materi</h1>
          <p>Buku digital Bentuk Baku. Mulai dari pengantar bilangan berpangkat, lalu bentuk baku.</p>
        </div>
        <div className="book-hero__mascot">
          {/* Berpikir ↔ membaca ↔ dapat ide; berganti pelan (di kepala halaman, bukan di dalam buku). */}
          <MascotLive poses={['think', 'book', 'idea']} cycleMs={9000} size={78} bubble="none" />
        </div>
      </header>

      <nav className="book-toc" aria-label="Daftar isi">
        <button type="button" className={`book-toc__item${page === 0 ? ' is-on' : ''}`} onClick={() => goTo(0)}>
          Sampul
        </button>
        {CHAPTERS.map((c) => {
          const start = chapterStart(c.id);
          const on = BOOK_PAGES[lastOfView]?.chapter === c.id || BOOK_PAGES[firstOfView]?.chapter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={`book-toc__item${on ? ' is-on' : ''}`}
              onClick={() => goTo(start)}
              aria-label={`Bab ${c.no}: ${c.title}`}
              title={`Bab ${c.no}: ${c.title}`}
            >
              {/* Laptop memakai label pendek agar keempat bab muat sebaris (lihat laptop.css). */}
              <span className="book-toc__full" aria-hidden="true">
                Bab {c.no}: {c.title}
              </span>
              <span className="book-toc__short" aria-hidden="true">
                {c.no}. {c.short}
              </span>
            </button>
          );
        })}
      </nav>

      <section
        className={`book${two ? ' book--two' : ' book--one'}`}
        aria-roledescription="buku"
        aria-label={`Buku materi, ${label} dari ${TOTAL - 1}`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div className="book__spread" aria-live="polite">
          {under.map((i, k) => (
            <BookPageView key={`${i}-${k}`} index={i} side={two ? (k === 0 ? 'left' : 'right') : 'right'} />
          ))}
          {two && <span className="book__spine" aria-hidden="true" />}
          {leaf && (
            <div className={`bk-leaf ${leaf.cls}`} style={{ animationDuration: `${FLIP_MS}ms` }} aria-hidden="true">
              <div className="bk-leaf__face bk-leaf__front">
                <BookPageView index={leaf.front} side={leaf.frontSide} />
              </div>
              {leaf.back !== undefined && (
                <div className="bk-leaf__face bk-leaf__back">
                  <BookPageView index={leaf.back} side={leaf.backSide} />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="book-nav">
        <button type="button" className="btn btn--outline btn--lg" onClick={prev} disabled={!canPrev} aria-label="Halaman sebelumnya">
          <IconLeft /> <span className="book-nav__txt">Sebelumnya</span>
        </button>
        <div className="book-nav__info">
          <b>{label}</b>
          <span className="meter" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </span>
          <span className="small muted">
            {stored.read.length} dari {TOTAL - 1} halaman sudah dibaca
          </span>
        </div>
        <button type="button" className="btn btn--primary btn--lg" onClick={next} disabled={!canNext} aria-label="Halaman berikutnya">
          <span className="book-nav__txt">Berikutnya</span> <IconRight />
        </button>
      </div>
      </div>

      <section className="stack-s" aria-labelledby="modul-title">
        <div className="row row--between">
          <h2 id="modul-title">Belajar bertahap per modul</h2>
          <Link to="/lab" className="btn btn--ghost btn--sm">
            Lab Koma →
          </Link>
        </div>
        <p className="small muted">Modul interaktif berisi contoh terurai, langkah terpandu, latihan, dan kuis.</p>
        <ModuleList path />
      </section>
    </main>
  );
}
