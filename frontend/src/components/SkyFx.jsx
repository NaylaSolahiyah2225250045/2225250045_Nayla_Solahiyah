/**
 * Animasi dekoratif langit (disetujui pengembang, 17 Nov 2026): bintang berkelap-kelip,
 * bintang jatuh sesekali dengan jejak cahaya, dan sedikit kilauan (sparkle).
 * HANYA di layar non-soal (Sambutan, Masuk/Daftar, menu Dashboard) — tidak di buku Materi,
 * Lab Koma, atau layar latihan/kuis (CLAUDE.md §2). Murni CSS (transform & opacity → ringan),
 * pointer-events: none, aria-hidden; gerak hanya bila [data-motion='on'].
 *
 * @param {{ tone?: 'light'|'dash' }} props  light = di atas latar ungu (Sambutan), dash = latar pucat
 */

// Posisi tersebar alami (x/y dalam %, s = ukuran px, d = jeda, t = lama satu kedip).
const TWINKLES = [
  { x: 6, y: 9, s: 5, d: 0, t: 4.2 },
  { x: 18, y: 4, s: 3, d: 1.4, t: 3.6 },
  { x: 33, y: 12, s: 4, d: 2.6, t: 5 },
  { x: 52, y: 5, s: 6, d: 0.8, t: 4.6 },
  { x: 71, y: 10, s: 3, d: 3.1, t: 3.8 },
  { x: 88, y: 6, s: 5, d: 1.9, t: 5.4 },
  { x: 95, y: 28, s: 4, d: 0.5, t: 4.4 },
  { x: 3, y: 42, s: 3, d: 2.2, t: 3.9 },
  { x: 97, y: 58, s: 6, d: 3.6, t: 5.2 },
  { x: 8, y: 74, s: 4, d: 1.1, t: 4.1 },
  { x: 92, y: 86, s: 3, d: 2.9, t: 3.7 },
  { x: 44, y: 94, s: 5, d: 0.3, t: 4.8 },
];

// Bintang jatuh: muncul ±1,3 detik setiap `c` detik (tidak terus-menerus).
const SHOOTERS = [
  { x: 78, y: 4, c: 17, d: 3 },
  { x: 46, y: 2, c: 23, d: 12 },
];

const SPARKLES = [
  { x: 14, y: 22, s: 14, d: 1 },
  { x: 84, y: 18, s: 12, d: 4.5 },
  { x: 90, y: 72, s: 16, d: 7.5 },
  { x: 22, y: 88, s: 12, d: 10 },
];

export default function SkyFx({ tone = 'dash' }) {
  return (
    <div className={`sky-fx sky-fx--${tone}`} aria-hidden="true">
      {TWINKLES.map((p, i) => (
        <span
          key={`t${i}`}
          className={`sky-twinkle sky-c${i % 4}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, '--s': `${p.s}px`, animationDelay: `${p.d}s`, animationDuration: `${p.t}s` }}
        />
      ))}
      {SHOOTERS.map((p, i) => (
        <span key={`s${i}`} className="sky-shoot" style={{ left: `${p.x}%`, top: `${p.y}%`, animationDuration: `${p.c}s`, animationDelay: `${p.d}s` }} />
      ))}
      {SPARKLES.map((p, i) => (
        <span
          key={`k${i}`}
          className={`sky-sparkle sky-c${(i + 1) % 4}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, '--s': `${p.s}px`, animationDelay: `${p.d}s` }}
        />
      ))}
    </div>
  );
}
