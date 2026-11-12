import { useEffect, useRef, useState } from 'react';
import Mascot from './Mascot.jsx';
import { useSettings } from '../lib/settings.js';

const STAR_COLORS = ['var(--cta)', 'var(--primary)', 'var(--star-pink)', 'var(--lead-digit)'];
const STAR_PATH = 'M12 2.5l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.4l-5.6 3.2 1.4-6.3L3 9l6.4-.6z';

/** Gerakan khas tiap pose (kelas CSS .ml-idle--<gerak>). */
export const POSE_MOTION = {
  smile: 'breathe',
  wink: 'sway',
  wave: 'breathe',
  happy: 'hop',
  jump: 'jump',
  think: 'tilt',
  book: 'nod',
  cheer: 'pump',
  point: 'sway',
  surprised: 'shake',
  idea: 'float',
  thumb: 'breathe',
  head: 'breathe',
};

/**
 * Maskot hidup: animasi masuk (kecil → normal, mantul jelly), gerak khas sesuai pose
 * (napas, goyang, lompat kecil, mengangguk saat membaca, memiringkan kepala saat berpikir,
 * melambai, mengedip), bergantian pose secara berkala, dan bintang kecil saat diketuk.
 * Semua animasi mengikuti pengaturan "Animasi" (lib/settings.js): bila nonaktif, maskot
 * tetap tampil (pose pertama) tetapi diam dan bintang tidak muncul.
 * Hanya untuk layar non-soal — CLAUDE.md §2. Hanya SATU maskot per halaman yang `idle`
 * (bergerak & berganti pose sendiri); maskot lain idle={false} (hanya bereaksi saat disentuh).
 *
 * @param {{ variant?: string, poses?: string[], cycleMs?: number, size?: number, lines?: string[],
 *   bubble?: 'top'|'left'|'right'|'none', celebrate?: boolean, className?: string, idle?: boolean,
 *   motion?: string, accessory?: string }} props
 */
export default function MascotLive({
  variant = 'book',
  poses,
  cycleMs = 7000,
  size = 200,
  lines = [],
  bubble = 'top',
  celebrate = false,
  className = '',
  idle = true,
  motion,
  accessory,
}) {
  const { animations } = useSettings();
  const list = poses?.length ? poses : [variant];
  const [poseIdx, setPoseIdx] = useState(0);
  const [swap, setSwap] = useState(0);
  const [stars, setStars] = useState([]);
  const [squish, setSquish] = useState(0);
  const [line, setLine] = useState(0);
  const [talked, setTalked] = useState(false);
  const nextId = useRef(0);
  const timers = useRef([]);
  const pose = list[poseIdx % list.length];
  const move = motion ?? POSE_MOTION[pose] ?? 'breathe';

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Ganti pose secara berkala (hanya maskot utama halaman, dan hanya bila animasi aktif).
  useEffect(() => {
    if (!idle || !animations || list.length < 2) return undefined;
    const t = setInterval(() => {
      setPoseIdx((i) => i + 1);
      setSwap((k) => k + 1);
    }, cycleMs);
    return () => clearInterval(t);
  }, [idle, animations, list.length, cycleMs]);

  const burst = (count = 10) => {
    if (!animations) return;
    const batch = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const dist = size * (0.42 + Math.random() * 0.28);
      return {
        id: ++nextId.current,
        dx: Math.round(Math.cos(angle) * dist),
        dy: Math.round(Math.sin(angle) * dist * 0.85 - size * 0.08),
        rot: Math.round(Math.random() * 280 - 140),
        s: (0.55 + Math.random() * 0.75).toFixed(2),
        color: STAR_COLORS[i % STAR_COLORS.length],
        delay: Math.round(Math.random() * 90),
      };
    });
    setStars((s) => [...s, ...batch]);
    setSquish((k) => k + 1);
    const ids = new Set(batch.map((b) => b.id));
    timers.current.push(setTimeout(() => setStars((s) => s.filter((x) => !ids.has(x.id))), 1200));
  };

  // Layar selesai: rayakan sekali setelah animasi masuk.
  useEffect(() => {
    if (!celebrate || !animations) return undefined;
    const t = setTimeout(() => burst(16), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrate, animations]);

  const onTap = () => {
    burst();
    // Kalimat berikutnya dipilih acak (tidak sama dengan yang sedang tampil) agar terasa bervariasi.
    if (lines.length > 1)
      setLine((l) => {
        const n = Math.floor(Math.random() * (lines.length - 1));
        return n >= l ? n + 1 : n;
      });
    setTalked(true);
    if (list.length > 1) {
      setPoseIdx((i) => i + 1);
      setSwap((k) => k + 1);
    }
  };

  const innerCls = squish ? 'ml-squish' : swap ? 'ml-swap' : 'ml-still';

  return (
    <div
      className={`mascot-live mascot-live--${pose} pose-${pose}${idle ? ' is-alive' : ''} ${className}`}
      style={{ '--ml-size': `${size}px` }}
    >
      {lines.length > 0 && bubble !== 'none' && (
        <p key={line} className={`mascot-bubble mascot-bubble--${bubble}${talked ? ' is-now' : ''}`} aria-live="polite">
          {lines[line]}
        </p>
      )}
      <button type="button" className="mascot-live__btn" onClick={onTap} aria-label="Maskot NoBaku, kapibara bertoga. Ketuk untuk menyapa.">
        <span className="ml-enter">
          <span className={`ml-idle${idle ? ` ml-idle--${move}` : ''}`}>
            <span key={`${pose}-${squish}-${swap}`} className={innerCls}>
              <Mascot variant={pose} size={size} title="" accessory={accessory} />
            </span>
          </span>
        </span>
      </button>
      <span className="mascot-live__stars" aria-hidden="true">
        {stars.map((st) => (
          <span
            key={st.id}
            className="ml-star"
            style={{ '--dx': `${st.dx}px`, '--dy': `${st.dy}px`, '--rot': `${st.rot}deg`, '--s': st.s, color: st.color, animationDelay: `${st.delay}ms` }}
          >
            <svg viewBox="0 0 24 24">
              <path d={STAR_PATH} fill="currentColor" />
            </svg>
          </span>
        ))}
      </span>
    </div>
  );
}
