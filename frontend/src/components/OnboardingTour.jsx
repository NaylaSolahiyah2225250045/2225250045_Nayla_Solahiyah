import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MascotLive from './MascotLive.jsx';
import { IconArrowLeft, IconArrowRight } from './NavIcons.jsx';
import { TOUR_STEPS } from '../content/onboarding.js';
import { completeTour } from '../lib/account.js';
import { closeTour } from '../lib/onboarding.js';

/**
 * Panduan awal (onboarding): tur 7 tahap dipandu maskot kapibara, tampil sebagai kartu dialog
 * di atas Dashboard (bukan layar penuh). Menu yang sedang dijelaskan disorot di sidebar (laptop)
 * atau navigasi bawah (HP) lewat atribut `data-tour-focus` pada <html>.
 * Selesai atau dilewati → status akun disimpan (completeTour), panduan tidak muncul otomatis lagi.
 */
const STUDENT_LABELS = { back: 'Sebelumnya', next: 'Selanjutnya', skip: 'Lewati Panduan', finish: 'Yuk, Mulai Belajar!' };

/**
 * @param {{ steps?: typeof TOUR_STEPS, home?: string, labels?: typeof STUDENT_LABELS }} props
 * Panduan siswa (bawaan) atau panduan guru (steps = TEACHER_TOUR_STEPS, home = '/guru').
 */
export default function OnboardingTour({ steps = TOUR_STEPS, home = '/beranda', labels = STUDENT_LABELS }) {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const primaryRef = useRef(null);
  const step = steps[i];
  const last = i === steps.length - 1;

  const finish = (goHome) => {
    completeTour();
    closeTour();
    if (goHome) navigate(home);
  };

  // Sorot menu yang sedang dijelaskan; bersihkan saat panduan ditutup.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.tour = 'on';
    root.dataset.tourFocus = step.focus.join(' ');
    const marked = step.focus.flatMap((id) => [...document.querySelectorAll(`[data-tour="${id}"]`)]);
    marked.forEach((el) => el.classList.add('is-tour-focus'));
    return () => {
      delete root.dataset.tour;
      delete root.dataset.tourFocus;
      marked.forEach((el) => el.classList.remove('is-tour-focus'));
    };
  }, [step]);

  // Fokus keyboard pada tombol utama setiap ganti tahap.
  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [i]);

  // Esc = lewati; panah kiri/kanan = sebelumnya/selanjutnya.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') finish(false);
      if (e.key === 'ArrowRight' && !last) setI((n) => n + 1);
      if (e.key === 'ArrowLeft' && i > 0) setI((n) => n - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <div className="tour" role="presentation">
      <div className="tour__backdrop" aria-hidden="true" />
      <section className="tour__card" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-text">
        <header className="tour__head">
          <span className="tour__count">
            {i + 1} dari {steps.length}
          </span>
          <span className="tour__dots" aria-hidden="true">
            {steps.map((s, k) => (
              <span key={s.id} className={k === i ? 'is-on' : k < i ? 'is-done' : ''} />
            ))}
          </span>
          {!last && (
            <button type="button" className="tour__skip" onClick={() => finish(false)}>
              {labels.skip}
            </button>
          )}
        </header>

        <div key={step.id} className="tour__body">
          <div className="tour__mascot">
            <MascotLive poses={[step.pose]} size={132} bubble="none" celebrate={last} />
          </div>
          <div className="tour__bubble">
            <h2 id="tour-title" className="tour__title">
              {step.title}
            </h2>
            <p id="tour-text" className="tour__text">
              {step.text}
            </p>
            {step.note && <p className="tour__note">{step.note}</p>}
          </div>
        </div>

        <footer className="tour__foot">
          <button type="button" className="btn btn--outline" onClick={() => setI((n) => n - 1)} disabled={i === 0}>
            <IconArrowLeft /> {labels.back}
          </button>
          {last ? (
            <button ref={primaryRef} type="button" className="btn btn--cta btn--pop" onClick={() => finish(true)}>
              {labels.finish}
            </button>
          ) : (
            <button ref={primaryRef} type="button" className="btn btn--primary" onClick={() => setI((n) => n + 1)}>
              {labels.next} <IconArrowRight />
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
