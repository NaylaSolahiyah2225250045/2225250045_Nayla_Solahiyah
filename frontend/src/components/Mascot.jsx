import logoSm from '../assets/logo-sm.webp';
import logoMd from '../assets/logo-md.webp';
/**
 * Maskot NoBaku: kapibara (SVG). Komponen ini sendiri statis; animasi (masuk jelly,
 * napas/lompat kecil, kedip, lambaian, bintang saat disentuh) ditambahkan oleh MascotLive.jsx
 * lewat kelas bagian .m-head / .m-eyes / .m-tassel / .m-arm.
 * Sesuai aturan beban kognitif, maskot tidak pernah di area soal/input/umpan balik soal.
 *
 * variant (pose):
 *   "smile"  tersenyum, tangan di samping      "wink"  berkedip satu mata
 *   "wave"   melambaikan tangan               "happy" senang (kedua tangan ke atas)
 *   "think"  berpikir (tangan di dagu)         "cheer" memberi semangat (kepalan ke atas)
 *   "thumb"  jempol                           "book"  membaca buku Σ
 *   "jump"   melompat kecil (tangan terangkat)  "point" menunjuk ke samping
 *   "surprised" terkejut / kagum              "idea"  dapat ide (bola lampu)
 *   "head"   kepala saja (logo/avatar; `accessory` = toga | bunga | kacamata | bintang | headset | pita | none)
 */
const C = {
  fur: '#D29A62',
  furDark: '#B97E48',
  snout: '#B27443',
  line: '#4A2F1E',
  cheek: '#F3A27E',
  cap: '#2E3266',
  capDark: '#23264F',
  tassel: '#FFC83D',
  book: '#7B6CF0',
  bookDark: '#5B4BD6',
  pink: '#F06FA6',
  star: '#FFC83D',
};

const STAR = 'M0 -8l2.3 5.2 5.7.6-4.3 3.8 1.3 5.6L0 4.3l-5 2.9 1.3-5.6-4.3-3.8 5.7-.6z';

function Cap({ x = 0, y = 0, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M62 50 v12 q38 16 76 0 v-12" fill={C.capDark} />
      <path d="M100 26 L168 48 L100 70 L32 48 Z" fill={C.cap} />
      <circle cx="100" cy="48" r="4.5" fill="#4A4F95" />
      <g className="m-tassel">
        <path d="M100 48 L150 58 L150 84" stroke={C.tassel} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M145 82 h10 l-2 14 h-6 z" fill={C.tassel} />
      </g>
    </g>
  );
}

/** Ekspresi mata. Mata kiri & kanan dipisah (.m-eye-l / .m-eye-r) agar bisa dianimasikan sendiri-sendiri. */
function Eyes({ kind }) {
  const arc = (x) => <path d={`M${x} 100 q9 -9 18 0`} stroke={C.line} strokeWidth="4.5" fill="none" strokeLinecap="round" />;
  const dot = (cx, cy, r = 5.5) => (
    <>
      <circle cx={cx} cy={cy} r={r} fill={C.line} />
      <circle cx={cx + r * 0.33} cy={cy - r * 0.36} r={r * 0.33} fill="#fff" />
    </>
  );
  const pair = (l, r) => (
    <>
      <g className="m-eye m-eye-l">{l}</g>
      <g className="m-eye m-eye-r">{r}</g>
    </>
  );
  switch (kind) {
    case 'open':
      return pair(dot(75, 98), dot(125, 98));
    case 'wink':
      // Mata kanan: versi tertutup tampil saat diam; saat animasi aktif, CSS membuka-menutupnya (kedipan genit).
      return pair(
        dot(75, 98),
        <>
          <g className="m-wink-open">{dot(125, 98)}</g>
          <g className="m-wink-closed">{arc(116)}</g>
        </>,
      );
    case 'up':
      return pair(dot(79, 94), dot(129, 94));
    case 'side':
      return pair(dot(80, 99), dot(130, 99));
    case 'surprised':
      return pair(
        <>
          <circle cx="75" cy="97" r="9" fill="#fff" />
          {dot(75, 97, 5.5)}
        </>,
        <>
          <circle cx="125" cy="97" r="9" fill="#fff" />
          {dot(125, 97, 5.5)}
        </>,
      );
    case 'determined':
      return (
        <>
          <path d="M64 85 l18 5" stroke={C.line} strokeWidth="4" strokeLinecap="round" />
          <path d="M136 85 l-18 5" stroke={C.line} strokeWidth="4" strokeLinecap="round" />
          {pair(dot(75, 99), dot(125, 99))}
        </>
      );
    default:
      return pair(arc(66), arc(116));
  }
}

/** Ekspresi mulut. */
function Mouth({ kind }) {
  switch (kind) {
    case 'open':
      return (
        <>
          <path d="M88 130 Q100 147 112 130 Z" fill={C.line} />
          <ellipse cx="100" cy="138" rx="5.5" ry="3.2" fill={C.cheek} />
        </>
      );
    case 'o':
      return <ellipse cx="100" cy="135" rx="5" ry="6" fill={C.line} />;
    case 'hmm':
      return <path d="M95 136 q6 -4 12 0" stroke={C.line} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    case 'grin':
      return <path d="M86 130 Q100 144 114 130" stroke={C.line} strokeWidth="4" fill="none" strokeLinecap="round" />;
    default:
      return <path d="M90 132 Q100 139 110 132" stroke={C.line} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
  }
}

function Head({ x = 0, y = 0, s = 1, eyes = 'happy', mouth = 'smile' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="58" cy="70" r="13" fill={C.furDark} />
      <circle cx="142" cy="70" r="13" fill={C.furDark} />
      <circle cx="58" cy="70" r="6" fill="#9A6235" />
      <circle cx="142" cy="70" r="6" fill="#9A6235" />
      <rect x="46" y="60" width="108" height="96" rx="44" fill={C.fur} />
      <ellipse cx="100" cy="126" rx="38" ry="27" fill={C.snout} />
      <ellipse cx="89" cy="116" rx="4" ry="2.6" fill={C.line} />
      <ellipse cx="111" cy="116" rx="4" ry="2.6" fill={C.line} />
      <Mouth kind={mouth} />
      <g className="m-eyes">
        <Eyes kind={eyes} />
      </g>
      <circle cx="64" cy="118" r="8" fill={C.cheek} opacity="0.55" />
      <circle cx="136" cy="118" r="8" fill={C.cheek} opacity="0.55" />
    </g>
  );
}

/** Aksesori avatar (koordinat kepala). */
function Accessory({ kind }) {
  switch (kind) {
    case 'bunga':
      return (
        <g transform="translate(140 62)">
          {[0, 72, 144, 216, 288].map((r) => (
            <circle key={r} cx={Math.round(Math.cos((r * Math.PI) / 180) * 9)} cy={Math.round(Math.sin((r * Math.PI) / 180) * 9)} r="7.5" fill={C.pink} />
          ))}
          <circle r="5.5" fill={C.star} />
        </g>
      );
    case 'kacamata':
      return (
        <g fill="rgb(255 255 255 / 25%)" stroke="#2E3266" strokeWidth="4">
          <circle cx="75" cy="98" r="14" />
          <circle cx="125" cy="98" r="14" />
          <path d="M89 97 q11 -6 22 0" fill="none" />
        </g>
      );
    case 'bintang':
      return <path d={STAR} transform="translate(138 64) scale(1.8)" fill={C.star} stroke="#E3A81E" strokeWidth="1" />;
    case 'headset':
      return (
        <g>
          <path d="M48 84 Q100 6 152 84" stroke="#2E3266" strokeWidth="8" fill="none" strokeLinecap="round" />
          <rect x="34" y="72" width="20" height="32" rx="9" fill="#7B6CF0" />
          <rect x="146" y="72" width="20" height="32" rx="9" fill="#7B6CF0" />
        </g>
      );
    case 'pita':
      return (
        <g transform="translate(100 58)">
          <path d="M0 0 L-24 -12 L-22 12 Z" fill="#E2629B" />
          <path d="M0 0 L24 -12 L22 12 Z" fill="#E2629B" />
          <circle r="6" fill="#C2185B" />
        </g>
      );
    case 'none':
      return null;
    default:
      return <Cap y={2} />;
  }
}

const SPARK = (x, y, s = 1, c = C.star) => <path d={STAR} transform={`translate(${x} ${y}) scale(${s})`} fill={c} />;

/** Ekspresi wajah untuk tiap pose. */
const FACE = {
  smile: { eyes: 'happy', mouth: 'smile' },
  wink: { eyes: 'wink', mouth: 'smile' },
  wave: { eyes: 'open', mouth: 'smile' },
  happy: { eyes: 'happy', mouth: 'open' },
  think: { eyes: 'up', mouth: 'hmm' },
  cheer: { eyes: 'determined', mouth: 'open' },
  jump: { eyes: 'happy', mouth: 'open' },
  point: { eyes: 'side', mouth: 'grin' },
  surprised: { eyes: 'surprised', mouth: 'o' },
  idea: { eyes: 'open', mouth: 'grin' },
  thumb: { eyes: 'happy', mouth: 'smile' },
  book: { eyes: 'happy', mouth: 'smile' },
};

export default function Mascot({ variant = 'book', size = 160, title, accessory = 'toga' }) {
  const label = title ?? 'Maskot NoBaku, kapibara bertoga';
  if (variant === 'head') {
    return (
      <svg viewBox="20 18 160 150" width={size} height={size} role="img" aria-label={label}>
        <Head />
        <Accessory kind={accessory} />
      </svg>
    );
  }
  const face = FACE[variant] ?? FACE.smile;
  return (
    <svg viewBox="0 0 200 230" width={size} height={size * 1.15} role="img" aria-label={label} overflow="visible">
      <ellipse cx="100" cy="222" rx="70" ry="7" fill="#000" opacity="0.08" />
      <ellipse cx="100" cy="176" rx="66" ry="50" fill={C.fur} />
      <ellipse cx="62" cy="214" rx="20" ry="9" fill={C.furDark} />
      <ellipse cx="138" cy="214" rx="20" ry="9" fill={C.furDark} />
      <g className="m-head">
        <Head y={20} eyes={face.eyes} mouth={face.mouth} />
        <Cap y={6} />
      </g>

      {variant === 'book' && (
        <g>
          <path d="M52 168 L100 180 L148 168 L148 214 L100 226 L52 214 Z" fill={C.book} />
          <path d="M100 180 L100 226" stroke={C.bookDark} strokeWidth="3" />
          <path d="M58 172 L98 182 L98 220 L58 210 Z" fill="#9C90F5" />
          <text x="124" y="208" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff" fontFamily="Nunito, Arial, sans-serif">
            Σ
          </text>
          <ellipse cx="54" cy="190" rx="11" ry="13" fill={C.fur} />
          <ellipse cx="146" cy="190" rx="11" ry="13" fill={C.fur} />
        </g>
      )}

      {variant === 'thumb' && (
        <g>
          <g className="m-arm">
            <ellipse cx="146" cy="176" rx="17" ry="15" fill={C.furDark} />
            <rect x="139" y="146" width="13" height="26" rx="6.5" fill={C.furDark} />
          </g>
          <ellipse cx="58" cy="182" rx="12" ry="14" fill={C.furDark} />
        </g>
      )}

      {(variant === 'smile' || variant === 'wink') && (
        <g>
          <ellipse cx="58" cy="182" rx="12" ry="14" fill={C.furDark} />
          <g className="m-arm">
            <ellipse cx="142" cy="182" rx="12" ry="14" fill={C.furDark} />
          </g>
        </g>
      )}

      {variant === 'wave' && (
        <g>
          <ellipse cx="58" cy="182" rx="12" ry="14" fill={C.furDark} />
          <g className="m-arm m-arm--raised">
            <rect x="152" y="118" width="20" height="54" rx="10" fill={C.furDark} transform="rotate(18 162 170)" />
            <circle cx="176" cy="118" r="13" fill={C.furDark} />
          </g>
        </g>
      )}

      {variant === 'happy' && (
        <g>
          <g className="m-arm m-arm--raised">
            <rect x="152" y="112" width="20" height="58" rx="10" fill={C.furDark} transform="rotate(26 162 170)" />
            <circle cx="182" cy="112" r="13" fill={C.furDark} />
          </g>
          <rect x="28" y="112" width="20" height="58" rx="10" fill={C.furDark} transform="rotate(-26 38 170)" />
          <circle cx="18" cy="112" r="13" fill={C.furDark} />
          {SPARK(30, 60, 1.1)}
          {SPARK(178, 70, 0.9, C.pink)}
          {SPARK(160, 28, 0.7)}
        </g>
      )}

      {variant === 'think' && (
        <g>
          <ellipse cx="58" cy="184" rx="12" ry="14" fill={C.furDark} />
          <rect x="122" y="158" width="18" height="44" rx="9" fill={C.furDark} transform="rotate(-24 131 200)" />
          <ellipse cx="118" cy="164" rx="14" ry="11" fill={C.furDark} />
          <circle cx="172" cy="74" r="5" fill="#fff" stroke="#C9C3FF" strokeWidth="2" />
          <circle cx="184" cy="56" r="7" fill="#fff" stroke="#C9C3FF" strokeWidth="2" />
          <circle cx="190" cy="32" r="11" fill="#fff" stroke="#C9C3FF" strokeWidth="2" />
          <text x="190" y="37" textAnchor="middle" fontSize="13" fontWeight="900" fill="#7B6CF0" fontFamily="Nunito, Arial, sans-serif">
            ?
          </text>
        </g>
      )}

      {variant === 'cheer' && (
        <g>
          <ellipse cx="58" cy="182" rx="12" ry="14" fill={C.furDark} />
          <g className="m-arm m-arm--raised">
            <rect x="150" y="124" width="20" height="50" rx="10" fill={C.furDark} transform="rotate(10 160 172)" />
            <rect x="158" y="104" width="26" height="26" rx="9" fill={C.furDark} />
            <path d="M162 112 h18 M162 120 h18" stroke="#9A6235" strokeWidth="2" />
          </g>
          {SPARK(186, 92, 0.75)}
        </g>
      )}

      {variant === 'jump' && (
        <g>
          <g className="m-arm m-arm--raised">
            <rect x="150" y="122" width="18" height="44" rx="9" fill={C.furDark} transform="rotate(38 159 166)" />
            <circle cx="180" cy="128" r="11" fill={C.furDark} />
          </g>
          <rect x="32" y="122" width="18" height="44" rx="9" fill={C.furDark} transform="rotate(-38 41 166)" />
          <circle cx="20" cy="128" r="11" fill={C.furDark} />
          <path d="M40 228 q8 -6 16 0 M144 228 q8 -6 16 0" stroke="#C9C3FF" strokeWidth="3" fill="none" strokeLinecap="round" />
          {SPARK(26, 90, 0.7)}
          {SPARK(176, 96, 0.6, C.pink)}
        </g>
      )}

      {variant === 'point' && (
        <g>
          <ellipse cx="58" cy="182" rx="12" ry="14" fill={C.furDark} />
          <g className="m-arm m-arm--point">
            <rect x="146" y="150" width="46" height="18" rx="9" fill={C.furDark} transform="rotate(-14 150 160)" />
            <circle cx="190" cy="148" r="10" fill={C.furDark} />
            <rect x="190" y="138" width="16" height="7" rx="3.5" fill={C.furDark} transform="rotate(-14 190 142)" />
          </g>
        </g>
      )}

      {variant === 'surprised' && (
        <g>
          <ellipse cx="50" cy="160" rx="12" ry="14" fill={C.furDark} />
          <ellipse cx="150" cy="160" rx="12" ry="14" fill={C.furDark} />
          <path d="M28 70 l-8 -10 M22 92 l-12 -2 M172 70 l8 -10 M178 92 l12 -2" stroke="#7B6CF0" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}

      {variant === 'idea' && (
        <g>
          <ellipse cx="58" cy="182" rx="12" ry="14" fill={C.furDark} />
          <g className="m-arm m-arm--raised">
            <rect x="150" y="128" width="18" height="44" rx="9" fill={C.furDark} transform="rotate(12 159 172)" />
            <rect x="158" y="114" width="7" height="20" rx="3.5" fill={C.furDark} />
            <circle cx="164" cy="132" r="10" fill={C.furDark} />
          </g>
          <g className="m-bulb">
            <circle cx="176" cy="40" r="17" fill="#FFE27A" stroke="#E3A81E" strokeWidth="2.5" />
            <path d="M170 44 q6 -10 12 0" stroke="#E3A81E" strokeWidth="2.5" fill="none" />
            <rect x="169" y="56" width="14" height="9" rx="3" fill="#9AA0C8" />
            <path d="M176 12 v-8 M196 22 l6 -6 M156 22 l-6 -6 M202 42 h7" stroke="#FFC83D" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>
      )}
    </svg>
  );
}

/** Logo: kepala maskot + tulisan NoBaku. */
/**
 * Logo resmi NoBaku (gambar kapibara bertoga di atas awan bertuliskan "NoBaku").
 * Gambar selalu utuh (persegi 1:1, object-fit: contain — tidak dipotong/berubah bentuk).
 * Pada ukuran kecil (< 72px) tulisan di dalam gambar terlalu kecil dibaca, jadi nama
 * "NoBaku" juga ditulis di sampingnya.
 * @param {{ size?: number, text?: boolean }} props
 */
export function Logo({ size = 44, text }) {
  const showText = text ?? size < 72;
  return (
    <span className="logo">
      <img className="logo__img" src={size > 90 ? logoMd : logoSm} width={size} height={size} alt={showText ? '' : 'NoBaku'} decoding="async" draggable="false" />
      {showText && <span className="logo__text">NoBaku</span>}
    </span>
  );
}
