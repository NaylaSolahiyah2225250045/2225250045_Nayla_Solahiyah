/**
 * Visual matematika untuk Asisten Belajar (RMT: Mathematically Specific Psychological Tools; CLT: worked example).
 *
 * - Dibuat oleh APLIKASI dengan lib/sci (tanpa floating point), sehingga setiap angka terverifikasi mesin.
 *   AI hanya MEMILIH id visual lewat penanda `[[visual:id]]`; backend memastikan id ada di daftar yang dikirim.
 * - Memakai CONTOH SERUPA (content/visuals.js), bukan bilangan soal, sehingga jawaban akhir tidak bocor.
 * - `summary` dikirim ke AI agar ia bisa merujuk contoh itu; angka di dalamnya boleh dipakai AI (sudah dihitung mesin).
 *
 * @typedef {{ id: string, label: string, summary: string, data: object }} Visual
 */
import { divide, multiply, parseStandard, shiftInfo, splitDecimal, toScientific, toStandard } from './sci/sci.js';
import { valueOf } from './sci/ops.js';
import { fmtSigned, powText, sciText } from './sci/format.js';
import { PMSTP_ROWS, VISUAL_EXAMPLES as EX, VISUAL_LABELS } from '../content/visuals.js';
import { skillOf, topicOf } from './rmt.js';

export const MAX_VISUALS = 4;

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '−': '⁻', '+': '⁺', '(': '⁽', ')': '⁾', m: 'ᵐ', n: 'ⁿ', ' ': '' };
/** "2+5" → "²⁺⁵" (pangkat berupa ekspresi) */
export const supText = (s) => String(s).split('').map((c) => SUP[c] ?? c).join('');
/** 10 dengan pangkat berupa ekspresi: 10²⁺⁵ */
const powExpr = (s) => `10${supText(s)}`;
const paren = (n) => (n < 0 ? `(${fmtSigned(n)})` : String(n));
const canon = (s) => String(s).replace(/\D/g, '').replace(/^0+|0+$/g, '') || '0';

// ------------------------------------------------------------------ pemeriksa kebocoran kunci
const SUP_DIGIT = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+', '⁽': '(', '⁾': ')' };
/** Normalisasi seperti backend (guardrails._norm_expr): superskrip → ^n, tanpa spasi & titik ribuan. */
const normExpr = (s) =>
  String(s)
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺⁽⁾]+/g, (m) => '^' + m.split('').map((c) => SUP_DIGIT[c]).join(''))
    .replace(/[−–]/g, '-')
    .replace(/\s+/g, '')
    .replace(/[x*·]/g, '×')
    .replace(/(?<=\d)\.(?=\d{3})/g, '')
    .toLowerCase();
/** Bilangan yang berdiri sendiri (bukan basis 10 dari 10ⁿ). */
const looseNumbers = (n) => n.replace(/10\^[-+(]*\d+\)?/g, ' ').match(/\d+(?:,\d+)?/g) ?? [];

/**
 * True bila teks memuat salah satu kunci jawaban. Kunci berupa bilangan dicocokkan per bilangan utuh
 * ("1.000" tidak dianggap ada di "100.000"); kunci berupa ekspresi/kalimat dicocokkan sebagai potongan teks.
 * @param {string} text @param {string[]} keys
 */
export function leaksKey(text, keys) {
  const n = normExpr(text);
  const nums = looseNumbers(n);
  return keys.some((key) => {
    const k = normExpr(key);
    if (!k) return false;
    return /^-?\d+(?:,\d+)?$/.test(k) ? nums.includes(k.replace(/^-/, '')) : n.includes(k);
  });
}

/** Semua teks yang tampil di sebuah visual: ringkasan + setiap string di datanya (angka pangkat ikut di ringkasan). */
export function visualText(v) {
  const strings = [];
  const walk = (x) => {
    if (typeof x === 'string') strings.push(x);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === 'object') Object.entries(x).forEach(([k, val]) => k !== 'kind' && walk(val));
  };
  walk(v.data);
  return [v.summary, ...strings].join(' | ');
}

// ------------------------------------------------------------------ pembuat visual
function placeVisual(value) {
  const p = splitDecimal(value);
  const digits = (p.int + p.frac).split('');
  const firstIdx = digits.findIndex((d) => d !== '0');
  const cols = digits
    .map((d, i) => ({ d, exp: p.int.length - 1 - i, role: i === firstIdx ? 'first' : d === '0' ? 'zero' : 'digit' }))
    .filter((c, i) => !(p.int === '0' && i === 0)); // "0," di depan bilangan desimal tidak masuk tabel
  return {
    data: { kind: 'nilai-tempat', value, cols, hasInt: p.int !== '0' },
    summary: `Tabel nilai tempat ${value}: ${cols.map((c) => `${c.d} di tempat ${powText(c.exp)}`).join(', ')}.`,
  };
}

function zerosVisual(n) {
  const text = toStandard({ sign: 1, digits: '1', exp: n });
  if (n >= 0) {
    return { data: { kind: 'kelompok-nol', n, text, groups: text.split('.') }, summary: `${powText(n)} = ${text}: angka 1 diikuti ${n} angka nol, dikelompokkan tiga-tiga.` };
  }
  return {
    data: { kind: 'kelompok-nol', n, text, positions: -n },
    summary: `${powText(n)} = ${text}: angka 1 ada di posisi ke-${-n} setelah koma.`,
  };
}

/** Rentang garis bilangan (26 Nov 2026): dulu selalu 10⁻³…10³, kini mengikuti ukuran bilangan soal. */
const LINE_RANGES = { small: [-5, -1], big: [1, 5], mid: [-3, 3] };

function lineVisual([from, to] = LINE_RANGES.mid) {
  const points = [];
  for (let n = from; n <= to; n++) points.push({ n, text: toStandard({ sign: 1, digits: '1', exp: n }) });
  const first = points[0];
  const last = points.at(-1);
  return {
    data: { kind: 'garis-bilangan', points },
    summary: `Garis bilangan pangkat 10 dari ${powText(first.n)} = ${first.text} sampai ${powText(last.n)} = ${last.text}. Satu langkah ke kanan, nilainya menjadi 10 kali lipat.`,
  };
}

function shiftVisual(value, reverse) {
  const info = shiftInfo(value);
  const { a, n } = toScientific(parseStandard(value));
  const k = Math.abs(info.jumps);
  const dir = (left) => (left ? 'ke kiri' : 'ke kanan');
  const summary = reverse
    ? `${sciText(a, n)} → ${value}: pangkat ${fmtSigned(n)}, jadi koma bergeser ${k} kali ${dir(n < 0)}; tempat kosong diisi nol.`
    : `${value} → ${sciText(a, n)}: koma melompat ${k} kali ${dir(n >= 0)}, jadi pangkatnya ${fmtSigned(n)}.`;
  return { data: { kind: 'geser-koma', value, a, n, reverse, ...info }, summary };
}

function stepsVisual(value, reverse) {
  const x = parseStandard(value);
  const { a, n } = toScientific(x);
  const k = Math.abs(n);
  const big = n >= 0;
  const rows = reverse
    ? [
        ['Lihat tanda pangkatnya', `${sciText(a, n)}: pangkat ${big ? 'positif' : 'negatif'}`],
        ['Tentukan arah geser koma', `${k} kali ${big ? 'ke kanan' : 'ke kiri'}`],
        ['Isi tempat kosong dengan nol', value],
      ]
    : [
        ['Cari angka bukan nol pertama', x.digits[0]],
        ['Taruh koma setelah angka itu', a],
        ['Hitung lompatan koma', `${k} kali ${big ? 'ke kiri' : 'ke kanan'}`],
        ['Tentukan tanda pangkat', big ? 'positif (bilangan 10 atau lebih)' : 'negatif (bilangan kurang dari 1)'],
        ['Tulis bentuk baku', sciText(a, n)],
      ];
  return {
    data: { kind: 'ubah-bentuk', reverse, rows },
    summary: `Contoh langkah: ${rows.map(([s, r]) => `${s}: ${r}`).join('; ')}.`,
  };
}

function opVisual(op, [x, y]) {
  const isMul = op === 'kali';
  const mx = parseStandard(x.a);
  const my = parseStandard(y.a);
  const rawA = toStandard(isMul ? multiply(mx, my) : divide(mx, my));
  const rawN = isMul ? x.n + y.n : x.n - y.n;
  const result = toScientific(isMul ? multiply(valueOf(x), valueOf(y)) : divide(valueOf(x), valueOf(y)));
  const sym = isMul ? '×' : ':';
  const expr = isMul ? `${x.n}+${paren(y.n)}` : `${x.n}−${paren(y.n)}`;
  const normalized = rawA !== result.a;
  const lines = [
    { label: 'Soal contoh', text: `(${sciText(x.a, x.n)}) ${sym} (${sciText(y.a, y.n)})` },
    { label: 'Kelompokkan', text: `(${x.a} ${sym} ${y.a}) × (${powText(x.n)} ${sym} ${powText(y.n)})` },
    { label: isMul ? 'Angka dikali, pangkat dijumlah' : 'Angka dibagi, pangkat dikurang', text: `${rawA} × ${powExpr(expr)} = ${sciText(rawA, rawN)}` },
  ];
  if (normalized) lines.push({ label: 'Normalkan (1 ≤ a < 10)', text: sciText(result.a, result.n) });
  return {
    data: { kind: 'kali-bagi', op, lines },
    summary: `Contoh ${isMul ? 'perkalian' : 'pembagian'}: ${lines.map((l) => l.text).join(' = ')}.`,
  };
}

/** Penjumlahan/pengurangan desimal tanpa floating point: "2,1" ± "3,4". */
function decOp(s1, s2, sign) {
  const parts = (s) => String(s).replace(/\./g, '').split(',');
  const k = Math.max(parts(s1)[1]?.length ?? 0, parts(s2)[1]?.length ?? 0);
  const big = (s) => {
    const [i, f = ''] = parts(s);
    return BigInt(i + f.padEnd(k, '0'));
  };
  const r = (big(s1) + BigInt(sign) * big(s2)).toString().padStart(k + 1, '0');
  const int = r.slice(0, r.length - k);
  const frac = r.slice(r.length - k).replace(/0+$/, '');
  return frac ? `${int},${frac}` : int;
}

function addVisual(op, [x, y]) {
  const isAdd = op === 'tambah';
  const sym = isAdd ? '+' : '−';
  const e = Math.min(x.n, y.n);
  const lift = (p) => {
    const v = parseStandard(p.a);
    return toStandard({ ...v, exp: v.exp + (p.n - e) });
  };
  const ax = lift(x);
  const ay = lift(y);
  const raw = decOp(ax, ay, isAdd ? 1 : -1);
  const rv = parseStandard(raw);
  const result = toScientific({ ...rv, exp: rv.exp + e });
  const lines = [{ label: 'Soal contoh', text: `(${sciText(x.a, x.n)}) ${sym} (${sciText(y.a, y.n)})` }];
  if (x.n !== y.n) lines.push({ label: 'Samakan pangkat dulu', text: `(${sciText(ax, e)}) ${sym} (${sciText(ay, e)})` });
  lines.push({ label: 'Angka depan dihitung, pangkat tetap', text: `(${ax} ${sym} ${ay}) × ${powText(e)} = ${sciText(raw, e)}` });
  if (raw !== result.a || e !== result.n) lines.push({ label: 'Normalkan (1 ≤ a < 10)', text: sciText(result.a, result.n) });
  return {
    data: { kind: 'tambah-kurang', op, lines },
    summary: `Contoh ${isAdd ? 'penjumlahan' : 'pengurangan'}: ${lines.map((l) => l.text).join(' = ')}.`,
  };
}

const pmstpVisual = () => ({ data: { kind: 'pmstp', rows: PMSTP_ROWS }, summary: `Tabel PMSTP: ${PMSTP_ROWS.map((r) => r.step).join(' → ')}.` });

// ------------------------------------------------------------------ pemilihan visual untuk satu soal
/** Tanda "besar" (≥ 1) atau "kecil" (< 1) dari bilangan utama soal; null bila tidak jelas. */
function sizeOf(q) {
  if (q.value !== undefined) {
    const x = parseStandard(q.value);
    if (x) return x.exp >= 0 ? 'big' : 'small';
  }
  if (q.type === 'place_value') return q.pos >= 0 ? 'big' : 'small';
  if (q.n !== undefined) return Number(q.n) >= 0 ? 'big' : 'small';
  if (/0,0/.test(q.text ?? '') || /⁻/.test(q.text ?? '')) return 'small';
  return null;
}

/**
 * Daftar visual yang cocok untuk satu soal (urut menurut relevansi, maksimal MAX_VISUALS).
 * @param {object} q soal
 * @param {string|null} topicId
 * @param {string} [avoidText] teks soal + kunci jawaban; contoh yang muncul di sini dilewati
 * @param {string[]} [keys] bentuk kunci jawaban; visual yang memuatnya dicoba dengan contoh lain atau dibuang
 * @returns {Visual[]}
 */
export function visualsFor(q, topicId = null, avoidText = '', keys = []) {
  const tokens = new Set((avoidText.match(/\d+(?:[.,]\d+)*/g) ?? []).map(canon));
  const badValue = (v) => tokens.has(canon(v)) || avoidText.includes(v);
  const badPow = (n) => avoidText.includes(powText(n)) || avoidText.includes(toStandard({ sign: 1, digits: '1', exp: n }));
  const badPair = ([x, y]) => avoidText.includes(sciText(x.a, x.n)) || avoidText.includes(sciText(y.a, y.n));
  /** Coba contoh satu per satu: lewati yang sama dengan soal, buang yang memuat kunci jawaban. */
  const tryEach = (cands, isBad, build) => {
    for (const c of cands) {
      if (isBad(c)) continue;
      const v = build(c);
      if (!leaksKey(visualText(v), keys)) return v;
    }
    return null;
  };
  const fixed = (v) => (leaksKey(visualText(v), keys) ? null : v);
  const shiftList = (middle) => (middle ? (small ? EX.shiftMiddleSmall : EX.shiftMiddleBig) : small ? EX.shiftSmall : EX.shiftBig);
  const size = sizeOf(q) ?? 'big';
  const small = size === 'small';
  const skill = skillOf(q);
  const topic = topicOf(q, topicId);
  const text = q.text ?? '';

  const make = {
    'nilai-tempat': () => tryEach(small ? EX.placeSmall : EX.placeBig, badValue, placeVisual),
    'kelompok-nol': () => tryEach(small ? EX.powSmall : EX.powBig, badPow, zerosVisual),
    // Rentang yang sesuai ukuran bilangan soal dulu; rentang yang memuat kunci jawaban dilewati.
    'garis-bilangan': () =>
      tryEach(
        sizeOf(q) === 'small' ? [LINE_RANGES.small, LINE_RANGES.mid, LINE_RANGES.big] : sizeOf(q) === 'big' ? [LINE_RANGES.big, LINE_RANGES.mid, LINE_RANGES.small] : [LINE_RANGES.mid, LINE_RANGES.big, LINE_RANGES.small],
        () => false,
        lineVisual,
      ),
    'geser-koma': (reverse = false, middle = false) => tryEach(shiftList(middle), badValue, (v) => shiftVisual(v, reverse)),
    'ubah-bentuk': (reverse = false, middle = false) => tryEach(shiftList(middle), badValue, (v) => stepsVisual(v, reverse)),
    'kali-bagi': (op = 'kali') => tryEach(op === 'kali' ? EX.mul : EX.div, badPair, (p) => opVisual(op, p)),
    'tambah-kurang': (op = 'tambah') => tryEach(op === 'tambah' ? EX.add : EX.sub, badPair, (p) => addVisual(op, p)),
    pmstp: () => fixed(pmstpVisual()),
  };

  /** @type {[string, ...any[]][]} */
  let plan;
  const mcOp = (/\)\s*:\s*\(/.test(text) && !/\)\s*×\s*\(/.test(text)) || /dibagi|dipotong|rata-rata|setiap 1/.test(text) ? 'bagi' : 'kali';
  const addOp = /\)\s*\+\s*\(/.test(text) ? 'tambah' : /\)\s*−\s*\(/.test(text) ? 'kurang' : null;
  switch (skill) {
    case 'pangkat10':
      plan = [['kelompok-nol'], ['nilai-tempat']];
      break;
    case 'nilaiTempat':
      plan = [['nilai-tempat'], ['kelompok-nol']];
      break;
    case 'keBaku':
      plan = [['geser-koma'], ['ubah-bentuk'], ['nilai-tempat']];
      break;
    case 'nolTengah':
      plan = [['geser-koma', false, true], ['ubah-bentuk', false, true], ['nilai-tempat']];
      break;
    case 'keBiasa':
      plan = [['geser-koma', true], ['ubah-bentuk', true]];
      break;
    case 'banding':
      plan = [['garis-bilangan']];
      break;
    case 'normal':
      plan = [['kali-bagi', 'kali'], ['geser-koma']];
      break;
    case 'kali':
    case 'bagi':
      plan = [['kali-bagi', skill]];
      break;
    case 'cerita':
      plan = [['pmstp'], ['kali-bagi', q.op === 'bagi' ? 'bagi' : 'kali']];
      break;
    default: {
      const byTopic = {
        t1: [['nilai-tempat'], ['kelompok-nol'], ['garis-bilangan']],
        t2: [['garis-bilangan'], ['kelompok-nol']],
        t3: [['geser-koma'], ['ubah-bentuk']],
        t4: addOp ? [['tambah-kurang', addOp], ['kali-bagi', 'kali']] : [['kali-bagi', mcOp], ['tambah-kurang', 'tambah']],
        t5: [['pmstp'], ['kali-bagi', mcOp]],
      };
      plan = byTopic[topic] ?? [['garis-bilangan']];
    }
  }
  // PMSTP untuk soal pemodelan (literasi RUMUS/TERAP), bukan untuk soal penalaran/tafsir saja
  const modeling = q.literacy?.process?.some((p) => p === 'RUMUS' || p === 'TERAP');
  if (modeling && !plan.some(([id]) => id === 'pmstp')) plan = [['pmstp'], ...plan];

  const out = [];
  for (const [id, ...args] of plan) {
    if (out.some((v) => v.id === id)) continue;
    const v = make[id](...args);
    if (!v) continue;
    out.push({ id, label: VISUAL_LABELS[id], summary: v.summary, data: v.data });
    if (out.length >= MAX_VISUALS) break;
  }
  return out;
}

/**
 * Rapikan notasi matematika di teks AI: 10^-3 → 10⁻³, 3 x 10 → 3 × 10, -> → →.
 * Hanya mengganti tampilan; tidak menambah angka.
 * @param {string} text
 */
export function formatMath(text) {
  return String(text)
    // LaTeX sederhana yang kadang ditulis model: $…$, \( … \), \frac{a}{b}, \times, \cdot, \div, \le, \text{…}, ^{n}
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\$([^$\n]+)\$/g, '$1')
    .replace(/\\[()[\]]/g, '')
    .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
    .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '$1')
    .replace(/\\(times|cdot)/g, '×')
    .replace(/\\div/g, ':')
    .replace(/\\(?:left|right)\s*/g, '')
    .replace(/\\leq?(?![a-z])/g, '≤')
    .replace(/\\geq?(?![a-z])/g, '≥')
    .replace(/\\[,;!]/g, ' ')
    .replace(/\{,\}/g, ',')
    .replace(/\\(?:left|right)\s*/g, '')
    .replace(/\^\{([0-9mn+\-−() ]+)\}/g, (_, e) => supText(e))
    .replace(/\^n\b/g, 'ⁿ')
    .replace(/\^\{\s*([-−+]?\d+)\s*\}/g, (_, e) => supText(e.replace('-', '−')))
    .replace(/\^(?:\(\s*([-−+]?\d+)\s*\)|([-−+]?\d+))/g, (_, p, e) => supText((p ?? e).replace('-', '−')))
    .replace(/(\d)\s*[x*]\s*(?=\d)/g, '$1 × ')
    .replace(/->/g, '→')
    .replace(/<-/g, '←');
}
