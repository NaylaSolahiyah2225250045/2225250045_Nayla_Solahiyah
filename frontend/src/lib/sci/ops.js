/**
 * Soal jenis baru (Topik 1, 2, 4, 5): nilai tempat, membandingkan, menormalkan, operasi kali/bagi.
 * Murni (tanpa React), TANPA floating point: semua angka dari string digit + pangkat bulat (BigInt untuk kali/bagi).
 *
 * Bentuk soal:
 *  - place_value : { type, value: "3.725", pos: 2 }                    nilai angka di tempat 10^pos
 *  - normalize   : { type, a: "45", n: 5 }                             ubah ke bentuk baku
 *  - operation   : { type, op: 'kali'|'bagi', x: {a, n}, y: {a, n}, text?, unit?, traps? }
 *  - compare     : soal pilihan ganda (choose_correct) dibuat oleh compareQuestion()
 */
import { divide, equalsValue, multiply, parseScientific, parseStandard, splitDecimal, toScientific, toStandard } from './sci.js';
import { fmtSigned, powText, sciText } from './format.js';

/** @typedef {{a: string, n: number}} SciParts */

/** Angka bertanda dalam kurung bila negatif: −3 → "(−3)". */
const paren = (n) => (n < 0 ? `(${fmtSigned(n)})` : String(n));

/** @param {SciParts} p @returns {import('./sci.js').SciNumber} */
export const valueOf = (p) => {
  const r = parseScientific(p.a, p.n);
  if (!r) throw new Error(`Bentuk tidak valid: ${p.a} × 10^${p.n}`);
  return r.value;
};

/** Bandingkan dua bilangan positif. @returns {-1|0|1} */
export function compareValues(x, y) {
  if (x.exp !== y.exp) return x.exp > y.exp ? 1 : -1;
  const len = Math.max(x.digits.length, y.digits.length);
  const dx = x.digits.padEnd(len, '0');
  const dy = y.digits.padEnd(len, '0');
  return dx === dy ? 0 : dx > dy ? 1 : -1;
}

// ---------------------------------------------------------------- nilai tempat
const PLACE_NAMES = {
  9: 'miliaran',
  8: 'ratus jutaan',
  7: 'puluh jutaan',
  6: 'jutaan',
  5: 'ratus ribuan',
  4: 'puluh ribuan',
  3: 'ribuan',
  2: 'ratusan',
  1: 'puluhan',
  0: 'satuan',
  '-1': 'persepuluhan',
  '-2': 'perseratusan',
  '-3': 'perseribuan',
  '-4': 'persepuluh ribuan',
  '-5': 'perseratus ribuan',
  '-6': 'persejutaan',
};
export const placeName = (pos) => PLACE_NAMES[pos] ?? `10 pangkat ${pos}`;

/**
 * Angka pada tempat 10^pos dan nilainya.
 * @param {string} value @param {number} pos
 * @returns {{ digit: string, answer: string } | null}
 */
export function placeValueOf(value, pos) {
  const p = splitDecimal(value);
  if (!p) return null;
  const digit = pos >= 0 ? p.int[p.int.length - 1 - pos] : p.frac[-pos - 1];
  if (!digit || digit === '0') return null;
  return { digit, answer: toStandard({ sign: 1, digits: digit, exp: pos }) };
}

export function placeValueSteps(value, pos) {
  const { digit, answer } = placeValueOf(value, pos);
  const unit = toStandard({ sign: 1, digits: '1', exp: pos });
  return [
    `Angka ${digit} ada di tempat ${placeName(pos)}.`,
    `Nilai tempat ${placeName(pos)} = ${powText(pos)} = ${unit}.`,
    `Jadi nilai angka ${digit} = ${digit} × ${unit} = ${answer}.`,
  ];
}

export function placeValueHints(value, pos) {
  const { digit } = placeValueOf(value, pos);
  return [
    `Tentukan dulu angka ${digit} berada di tempat apa.`,
    `Angka ${digit} ada di tempat ${placeName(pos)}, yaitu ${powText(pos)}.`,
    `Kalikan ${digit} dengan ${toStandard({ sign: 1, digits: '1', exp: pos })}.`,
  ];
}

// ---------------------------------------------------------------- menormalkan
/** a × 10ⁿ (a belum tentu 1 ≤ a < 10) → bentuk baku. */
export function normalizeKey(a, n) {
  return toScientific(valueOf({ a, n }));
}

export function normalizeSteps(a, n) {
  const aVal = parseStandard(a, { allowThousands: false });
  const k = aVal.exp; // geseran pangkat dari a
  const aNorm = toScientific({ ...aVal, exp: 0 }).a;
  const key = normalizeKey(a, n);
  return [
    k > 0
      ? `${a} lebih dari 10, jadi belum bentuk baku.`
      : k < 0
        ? `${a} kurang dari 1, jadi belum bentuk baku.`
        : `${a} sudah di antara 1 dan 10.`,
    `Tulis ${a} sebagai ${sciText(aNorm, k)}.`,
    `Gabungkan pangkatnya: ${powText(k)} × ${powText(n)} = 10 pangkat (${k} + ${paren(n)}) = ${powText(k + n)}.`,
    `Jadi ${sciText(a, n)} = ${sciText(key.a, key.n)}.`,
  ];
}

export function normalizeHints(a, n) {
  const aVal = parseStandard(a, { allowThousands: false });
  const aNorm = toScientific({ ...aVal, exp: 0 }).a;
  return [
    'Nilai a harus 1 atau lebih, tetapi kurang dari 10. Apakah sudah?',
    `${a} = ${sciText(aNorm, aVal.exp)}.`,
    `Jumlahkan pangkatnya: ${aVal.exp} + ${paren(n)}. Bilangan depannya ${aNorm}.`,
  ];
}

// ---------------------------------------------------------------- kali & bagi
/** Hasil bagian depan (a × b atau a : b) sebelum dinormalkan, sebagai SciNumber. */
function mantissaResult(q) {
  const x = parseStandard(q.x.a, { allowThousands: false });
  const y = parseStandard(q.y.a, { allowThousands: false });
  return q.op === 'kali' ? multiply(x, y) : divide(x, y);
}

/** Hasil operasi (SciNumber). */
export function operationValue(q) {
  return q.op === 'kali' ? multiply(valueOf(q.x), valueOf(q.y)) : divide(valueOf(q.x), valueOf(q.y));
}

/** Kunci jawaban operasi dalam bentuk baku. */
export const operationKey = (q) => toScientific(operationValue(q));

/** "(2 × 10³) × (3 × 10⁴)" */
export const operationText = (q) => `(${sciText(q.x.a, q.x.n)}) ${q.op === 'kali' ? '×' : ':'} (${sciText(q.y.a, q.y.n)})`;

/** Langkah penyelesaian operasi (4 langkah). */
export function operationSteps(q) {
  const m = mantissaResult(q);
  const mText = toStandard(m);
  const isMul = q.op === 'kali';
  const n = isMul ? q.x.n + q.y.n : q.x.n - q.y.n;
  const key = operationKey(q);
  const unit = q.unit ? ` ${q.unit}` : '';
  const shift = m.exp; // 0 bila bagian depan sudah 1–10; 1 bila ≥ 10; −1 bila < 1
  let norm;
  if (shift === 0) norm = `${mText} sudah di antara 1 dan 10, jadi tidak perlu digeser.`;
  else if (shift > 0) norm = `${mText} belum di antara 1 dan 10: ${mText} = ${sciText(key.a, shift)}. Pangkatnya ditambah ${shift} → ${powText(n + shift)}.`;
  else norm = `${mText} kurang dari 1: ${mText} = ${sciText(key.a, shift)}. Pangkatnya dikurangi ${-shift} → ${powText(n + shift)}.`;
  return [
    isMul ? `Kalikan bilangan depannya: ${q.x.a} × ${q.y.a} = ${mText}.` : `Bagi bilangan depannya: ${q.x.a} : ${q.y.a} = ${mText}.`,
    isMul
      ? `Kali → pangkat dijumlah: ${q.x.n} + ${paren(q.y.n)} = ${n}, jadi ${powText(n)}.`
      : `Bagi → pangkat dikurang: ${q.x.n} − ${paren(q.y.n)} = ${n}, jadi ${powText(n)}.`,
    norm,
    `Jadi hasilnya ${sciText(key.a, key.n)}${unit}.`,
  ];
}

export function operationHints(q) {
  const isMul = q.op === 'kali';
  const m = toStandard(mantissaResult(q));
  return [
    isMul ? 'Kalikan bilangan depannya, lalu jumlahkan pangkatnya.' : 'Bagi bilangan depannya, lalu kurangkan pangkatnya.',
    `Bilangan depannya: ${q.x.a} ${isMul ? '×' : ':'} ${q.y.a} = ${m}. Pangkatnya: ${isMul ? `${q.x.n} + ${paren(q.y.n)}` : `${q.x.n} − ${paren(q.y.n)}`}.`,
    'Periksa: apakah bilangan depannya sudah di antara 1 dan 10? Jika belum, geser komanya dan sesuaikan pangkatnya.',
  ];
}

/**
 * Diagnosis jawaban operasi.
 * @returns {{correct: boolean, errorCode: string|null}}
 */
export function diagnoseOperation(q, response) {
  const key = operationValue(q);
  const parsed = parseScientific(response?.a, response?.n);
  if (!parsed) return { correct: false, errorCode: 'E-FORMAT' };
  if (equalsValue(parsed.value, key)) return parsed.normalized ? { correct: true, errorCode: null } : { correct: false, errorCode: 'E-NORMAL' };
  for (const t of q.traps ?? []) {
    if (equalsValue(parsed.value, valueOf(t))) return { correct: false, errorCode: t.code };
  }
  if (parsed.value.digits === key.digits) return { correct: false, errorCode: 'E-OPERASI' };
  return { correct: false, errorCode: 'E-LAIN' };
}

// ---------------------------------------------------------------- membandingkan
/**
 * Soal pilihan ganda "mana yang lebih besar/kecil" — kunci dihitung, bukan diketik.
 * @param {SciParts[]} items 2–4 bilangan berbeda
 * @param {'besar'|'kecil'} want
 * @param {object} [extra] mis. text konteks
 */
export function compareQuestion(items, want = 'besar', extra = {}) {
  const vals = items.map(valueOf);
  let best = 0;
  vals.forEach((v, i) => {
    const c = compareValues(v, vals[best]);
    if ((want === 'besar' && c > 0) || (want === 'kecil' && c < 0)) best = i;
  });
  const keys = 'abcd';
  return {
    type: 'choose_correct',
    focus: 'compare',
    want,
    items,
    text: extra.text ?? `Manakah yang paling ${want}?`,
    options: items.map((p, i) => ({ key: keys[i], text: sciText(p.a, p.n), ...(i === best ? {} : { errorCode: 'E-PANGKAT' }) })),
    answer: keys[best],
    ...extra,
  };
}

export function compareSteps(q) {
  const vals = q.items.map(valueOf);
  const ans = q.items[q.options.findIndex((o) => o.key === q.answer)];
  const sameExp = new Set(q.items.map((p) => p.n)).size === 1;
  if (sameExp) {
    return [
      `Pangkatnya sama, yaitu ${powText(q.items[0].n)}.`,
      `Jadi bandingkan bilangan depannya: ${q.items.map((p) => p.a).join(', ')}.`,
      `Yang paling ${q.want} adalah ${sciText(ans.a, ans.n)}.`,
    ];
  }
  const sorted = [...q.items].sort((p, r) => r.n - p.n);
  return [
    `Bandingkan pangkatnya dulu: ${sorted.map((p) => powText(p.n)).join(' > ')}.`,
    'Karena a selalu 1 sampai kurang dari 10, pangkat yang lebih besar berarti bilangan yang lebih besar. Ingat: −3 lebih besar dari −5.',
    `Jadi yang paling ${q.want} adalah ${sciText(ans.a, ans.n)} = ${toStandard(vals[q.items.indexOf(ans)])}.`,
  ];
}

export function compareHints(q) {
  const sameExp = new Set(q.items.map((p) => p.n)).size === 1;
  return [
    'Lihat pangkatnya dulu, baru bilangan depannya.',
    'Pangkat lebih besar → bilangan lebih besar. Pada pangkat negatif, −2 lebih besar dari −4.',
    sameExp
      ? `Pangkatnya sama (${powText(q.items[0].n)}), jadi bandingkan bilangan depannya saja.`
      : `Urutkan pangkatnya: ${[...q.items].sort((p, r) => r.n - p.n).map((p) => powText(p.n)).join(' > ')}.`,
  ];
}
