import SkyFx from './SkyFx.jsx';
/**
 * Hiasan latar: taburan bintang/kilau dengan ukuran & jarak bervariasi, ditambah sedikit angka,
 * simbol matematika, bentuk geometri, dan titik-titik. Dipakai di kepala halaman/latar sambutan,
 * BUKAN di area soal/teks belajar. Bintang berkilau & melayang pelan, sesekali ada bintang jatuh —
 * semuanya hanya bila Animasi aktif. aria-hidden.
 */

/** PRNG kecil berbiji agar taburan terlihat acak-alami tetapi tetap sama di setiap kunjungan. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZES = [7, 9, 10, 12, 14, 17, 20, 24];

/**
 * Taburan bintang di dalam zona (persen), dengan jarak minimum agar tidak bergerombol/berbaris.
 * @returns {{x:number, y:number, s:number, shape:'star'|'spark'|'glint', c:string, dur:number, delay:number, drift:boolean}[]}
 */
export function scatterStars({ seed, count, zone = [55, 97, 8, 90], minDist = 11 }) {
  const r = rng(seed);
  const [x0, x1, y0, y1] = zone;
  const out = [];
  for (let tries = 0; out.length < count && tries < count * 40; tries++) {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    if (out.some((p) => Math.hypot(p.x - x, (p.y - y) * 0.6) < minDist)) continue;
    const s = SIZES[Math.floor(r() * SIZES.length)];
    const shape = s <= 9 ? 'glint' : r() < 0.45 ? 'spark' : 'star';
    const c = r() < 0.6 ? 'gold' : r() < 0.5 ? 'pink' : 'soft';
    out.push({ x, y, s, shape, c, dur: 2.2 + r() * 2.8, delay: r() * 3, drift: r() < 0.5 });
  }
  return out;
}

const SETS = {
  home: { seed: 11, count: 8, zone: [50, 97, 6, 92], items: [{ t: 'text', v: '10³', x: 84, y: 60, s: 22 }, { t: 'ring', x: 72, y: 78, s: 26 }, { t: 'dots', x: 56, y: 84, s: 40 }, { t: 'cloud', x: 60, y: 14, s: 22 }], meteor: true },
  book: { seed: 23, count: 6, items: [{ t: 'text', v: 'a²', x: 70, y: 22, s: 24 }, { t: 'tri', x: 62, y: 70, s: 18 }, { t: 'dots', x: 80, y: 82, s: 36 }] },
  path: { seed: 37, count: 6, items: [{ t: 'plus', x: 88, y: 62, s: 16 }, { t: 'sq', x: 64, y: 72, s: 16 }, { t: 'text', v: '10⁶', x: 80, y: 28, s: 18 }] },
  notes: { seed: 41, count: 6, items: [{ t: 'text', v: '=', x: 70, y: 24, s: 24 }, { t: 'ring', x: 62, y: 70, s: 20 }, { t: 'dots', x: 80, y: 76, s: 36 }] },
  history: { seed: 53, count: 6, items: [{ t: 'text', v: '✓', x: 70, y: 22, s: 22 }, { t: 'tri', x: 62, y: 74, s: 18 }, { t: 'dots', x: 80, y: 18, s: 32 }] },
  calendar: { seed: 67, count: 6, items: [{ t: 'ring', x: 86, y: 68, s: 22 }, { t: 'text', v: '7', x: 62, y: 66, s: 20 }, { t: 'dots', x: 78, y: 22, s: 36 }] },
  profile: { seed: 71, count: 9, zone: [3, 97, 6, 92], minDist: 13, items: [{ t: 'text', v: '10²', x: 84, y: 72, s: 18 }, { t: 'sq', x: 14, y: 78, s: 14 }, { t: 'dots', x: 68, y: 86, s: 36 }], meteor: true },
  lab: { seed: 83, count: 7, items: [{ t: 'text', v: ',', x: 74, y: 30, s: 30 }, { t: 'plus', x: 90, y: 70, s: 14 }, { t: 'dots', x: 62, y: 78, s: 34 }] },
  side: { seed: 131, count: 4, zone: [8, 92, 52, 92], minDist: 22, items: [{ t: 'text', v: '×10²', x: 6, y: 74, s: 14 }, { t: 'ring', x: 82, y: 56, s: 16 }, { t: 'plus', x: 14, y: 56, s: 12 }] },
  welcome: {
    seed: 97,
    count: 14,
    zone: [2, 98, 3, 97],
    minDist: 12,
    items: [
      { t: 'cloud', x: 10, y: 22, s: 30 },
      { t: 'cloud', x: 88, y: 40, s: 24 },
      { t: 'cloud', x: 16, y: 78, s: 20 },
    ],
    meteor: true,
  },
  // Dashboard Guru (21 Nov 2026): kepala halaman guru memakai gaya taburan yang sama dengan siswa
  guru: { seed: 151, count: 8, zone: [50, 97, 6, 92], items: [{ t: 'text', v: '×10²', x: 82, y: 64, s: 20 }, { t: 'ring', x: 70, y: 80, s: 24 }, { t: 'cloud', x: 58, y: 16, s: 22 }], meteor: true },
  kelas: { seed: 163, count: 6, items: [{ t: 'text', v: 'A', x: 72, y: 24, s: 22 }, { t: 'sq', x: 62, y: 72, s: 16 }, { t: 'dots', x: 82, y: 80, s: 36 }] },
  siswa: { seed: 173, count: 6, items: [{ t: 'ring', x: 86, y: 66, s: 20 }, { t: 'text', v: '★', x: 64, y: 70, s: 18 }, { t: 'dots', x: 78, y: 20, s: 34 }] },
  progres: { seed: 181, count: 6, items: [{ t: 'text', v: '%', x: 72, y: 24, s: 22 }, { t: 'tri', x: 62, y: 72, s: 18 }, { t: 'dots', x: 82, y: 80, s: 34 }] },
  hasil: { seed: 191, count: 6, items: [{ t: 'text', v: '✓', x: 70, y: 22, s: 22 }, { t: 'plus', x: 88, y: 66, s: 14 }, { t: 'dots', x: 64, y: 82, s: 34 }] },
};

const STAR = 'M12 1.5l2.6 6.6 6.9.6-5.3 4.6 1.6 6.9L12 16.6l-5.8 3.6 1.6-6.9L2.5 8.7l6.9-.6z';
const SPARK = 'M12 0c.9 6.2 3.8 9.4 12 12-8.2 2.6-11.1 5.8-12 12-.9-6.2-3.8-9.4-12-12 8.2-2.6 11.1-5.8 12-12z';

function Star({ st }) {
  const style = { left: `${st.x}%`, top: `${st.y}%`, '--s': `${st.s}px`, '--dur': `${st.dur.toFixed(2)}s`, '--delay': `${st.delay.toFixed(2)}s` };
  const cls = `deco deco--${st.shape} is-${st.c}${st.drift ? ' is-drift' : ''}`;
  if (st.shape === 'glint') return <span className={cls} style={style} />;
  return (
    <svg className={cls} style={style} viewBox="0 0 24 24">
      <path d={st.shape === 'spark' ? SPARK : STAR} fill="currentColor" />
    </svg>
  );
}

function Item({ it }) {
  const style = { left: `${it.x}%`, top: `${it.y}%`, '--s': `${it.s}px` };
  if (it.t === 'text')
    return (
      <span className="deco deco--text" style={style}>
        {it.v}
      </span>
    );
  return <span className={`deco deco--${it.t}`} style={style} />;
}

export default function Decor({ set = 'home', className = '' }) {
  const cfg = SETS[set] ?? SETS.home;
  const stars = scatterStars(cfg);
  return (
    <span className={`decor ${className}`} aria-hidden="true">
      {cfg.items.map((it, i) => (
        <Item key={`i${i}`} it={it} />
      ))}
      {stars.map((st, i) => (
        <Star key={`s${i}`} st={st} />
      ))}
      {cfg.meteor && <span className="deco deco--meteor" />}
    </span>
  );
}

/*
 * Latar Dashboard di laptop: bintang, simbol matematika, dan bentuk geometri di tepi area konten.
 * Posisi diatur tangan (persen dari area konten) agar tersebar alami dan kebanyakan jatuh di
 * tepi/sela kartu, bukan di tengah teks. Di HP hanya hiasan bertanda `hp` (kecil, di tepi layar), dan
 * tidak dipasang di layar belajar (Materi, Lab Koma) — lihat MainLayout.
 * t: star|spark|glint|text|ring|tri|sq|plus|dots|hex ; c: warna (gold|pink|violet|teal|blue) ; hp: juga tampil (kecil) di HP
 */
const BACKDROP = [
  { hp: true, t: 'star', x: 98.4, y: 5, s: 22, c: 'gold', dur: 3.6, delay: 0.2 },
  { hp: true, t: 'text', v: '×', x: 1.9, y: 13, s: 22, c: 'violet' },
  { t: 'spark', x: 1.9, y: 31, s: 13, c: 'pink', dur: 2.8, delay: 1.1 },
  { hp: true, t: 'ring', x: 98.4, y: 24, s: 22, c: 'teal' },
  { t: 'text', v: '10⁶', x: 98.4, y: 41, s: 15, c: 'blue' },
  { hp: true, t: 'tri', x: 1.9, y: 47, s: 20, c: 'blue' },
  { t: 'glint', x: 1.9, y: 58, s: 9, c: 'gold', dur: 2.4, delay: 0.6 },
  { hp: true, t: 'text', v: '÷', x: 98.4, y: 56, s: 22, c: 'pink' },
  { t: 'sq', x: 98.4, y: 70, s: 18, c: 'gold' },
  { t: 'hex', x: 1.9, y: 70, s: 22, c: 'violet' },
  { hp: true, t: 'spark', x: 98.4, y: 84, s: 16, c: 'violet', dur: 3.2, delay: 1.8 },
  { hp: true, t: 'text', v: '√', x: 1.9, y: 86, s: 22, c: 'teal' },
  { t: 'dots', x: 86, y: 99, s: 44, c: 'violet' },
  { t: 'plus', x: 34, y: 98.6, s: 16, c: 'gold' },
  { t: 'star', x: 62, y: 99, s: 12, c: 'pink', dur: 4.2, delay: 0.9 },
  { t: 'text', v: '+', x: 48, y: 1.4, s: 22, c: 'teal' },
  { t: 'glint', x: 74, y: 1.6, s: 8, c: 'gold', dur: 2.6, delay: 1.4 },
  { t: 'ring', x: 20, y: 99.2, s: 18, c: 'pink' },
  // Awan pastel di tepi (21 Nov 2026)
  { hp: true, t: 'cloud', x: 97, y: 33, s: 22, c: 'violet' },
  { t: 'cloud', x: 3, y: 39, s: 26, c: 'blue' },
  { t: 'cloud', x: 97.4, y: 92, s: 24, c: 'pink' },
  { hp: true, t: 'cloud', x: 2.6, y: 96, s: 20, c: 'blue' },
];

/**
 * @param {{ variant?: 'dash'|'study' }} props
 * 'study' (21 Nov 2026) = latar lembut untuk layar belajar (soal, modul): hiasan yang sama di tepi layar
 * (di HP hanya yang bertanda hp) + gumpalan warna, tanpa bintang jatuh — tidak pernah di area soal/teks.
 */
export function DashBackdrop({ variant = 'dash' }) {
  return (
    <div className={`dash-backdrop dash-backdrop--${variant}`} aria-hidden="true">
      <SkyFx tone="dash" />
      <span className="dash-backdrop__blob dash-backdrop__blob--sun" />
      <span className="dash-backdrop__blob dash-backdrop__blob--teal" />
      <span className="dash-backdrop__blob dash-backdrop__blob--pink" />
      {BACKDROP.map((it, i) => {
        const style = { left: `${it.x}%`, top: `${it.y}%`, '--s': `${it.s}px`, '--dur': `${it.dur ?? 3}s`, '--delay': `${it.delay ?? 0}s` };
        const cls = `deco deco--${it.t} bd-${it.c}${it.hp ? ' bd-hp' : ''}`;
        if (it.t === 'star' || it.t === 'spark')
          return (
            <svg key={i} className={`${cls} is-drift`} style={style} viewBox="0 0 24 24">
              <path d={it.t === 'spark' ? SPARK : STAR} fill="currentColor" />
            </svg>
          );
        if (it.t === 'text')
          return (
            <span key={i} className={cls} style={style}>
              {it.v}
            </span>
          );
        return <span key={i} className={cls} style={style} />;
      })}
    </div>
  );
}
