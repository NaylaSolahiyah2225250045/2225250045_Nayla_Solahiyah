import { parseStandard, parseScientific, toScientific, toStandard, firstNonZeroPosition } from './sci.js';
import { diagnoseToScientific, diagnoseToStandard, diagnosePowerOfTen } from './diagnose.js';
import { zeroHints } from './steps.js';
import {
  compareHints,
  diagnoseOperation,
  normalizeHints,
  normalizeKey,
  operationHints,
  operationKey,
  placeValueHints,
  placeValueOf,
  valueOf,
} from './ops.js';

/**
 * Tipe soal:
 *  - to_scientific  : { type, value: "0,00032" }
 *  - to_standard    : { type, a: "6,02", n: -3 }
 *  - power_of_ten   : { type, value: "0,001" }          (isi pangkatnya saja)
 *  - ten_to_standard: { type, n: 4 }                    (10^4 = …)
 *  - choose_correct : { type, text, options: [{key, text, errorCode?}], answer: "b" }
 *  - place_value    : { type, value: "3.725", pos: 2 }    nilai angka di tempat 10^pos (lib/sci/ops.js)
 *  - normalize      : { type, a: "45", n: 5 }              ubah ke bentuk baku
 *  - operation      : { type, op: 'kali'|'bagi', x: {a,n}, y: {a,n}, text?, unit?, traps? }
 * Semua tipe boleh punya `text` (soal cerita / konteks) — dipakai sebagai kalimat soal.
 * Opsional focus: 'zero' (Modul 4, butuh value) | 'back' (Modul 5, butuh a & n) — memilih
 * petunjuk & pembahasan khusus (lib/sci/steps.js). Soal tanpa focus (Modul 1–3) tidak berubah.
 * Kunci jawaban dihitung dari logika sci (bukan ditulis manual), kecuali choose_correct.
 */

/** Kunci jawaban yang siap ditampilkan. */
export function answerKey(q) {
  switch (q.type) {
    case 'to_scientific':
      return toScientific(parseStandard(q.value));
    case 'to_standard':
      return toStandard(parseScientific(q.a, q.n).value);
    case 'power_of_ten':
      return parseStandard(q.value).exp;
    case 'ten_to_standard':
      return toStandard({ sign: 1, digits: '1', exp: q.n });
    case 'place_value':
      return placeValueOf(q.value, q.pos).answer;
    case 'normalize':
      return normalizeKey(q.a, q.n);
    case 'operation':
      return operationKey(q);
    case 'choose_correct':
      return q.answer;
    default:
      throw new Error(`Tipe soal tidak dikenal: ${q.type}`);
  }
}

/** Periksa jawaban siswa. @returns {{correct: boolean, errorCode: string|null}} */
export function checkAnswer(q, response) {
  switch (q.type) {
    case 'to_scientific':
      return diagnoseToScientific(q.value, response);
    case 'to_standard':
      return diagnoseToStandard(q, response);
    case 'power_of_ten':
      return diagnosePowerOfTen(q.value, response);
    case 'ten_to_standard':
      return diagnoseToStandard({ a: '1', n: q.n }, response);
    case 'place_value':
      return diagnoseToStandard({ a: placeValueOf(q.value, q.pos).digit, n: q.pos }, response);
    case 'normalize':
      return diagnoseToScientific(toStandard(valueOf(q)), response);
    case 'operation':
      return diagnoseOperation(q, response);
    case 'choose_correct': {
      if (!response) return { correct: false, errorCode: 'E-FORMAT' };
      if (response === q.answer) return { correct: true, errorCode: null };
      const opt = q.options.find((o) => o.key === response);
      return { correct: false, errorCode: opt?.errorCode ?? 'E-LAIN' };
    }
    default:
      throw new Error(`Tipe soal tidak dikenal: ${q.type}`);
  }
}

/** Bilangan bentuk biasa yang relevan untuk divisualisasikan (atau null). */
export function visualValue(q) {
  switch (q.type) {
    case 'to_scientific':
    case 'power_of_ten':
      return q.value;
    case 'to_standard':
      return toStandard(parseScientific(q.a, q.n).value);
    case 'ten_to_standard':
      return toStandard({ sign: 1, digits: '1', exp: q.n });
    default:
      return q.visual ?? null;
  }
}

const dirWord = (n) => (n >= 0 ? 'kiri' : 'kanan');

/** Petunjuk bertingkat (3 level), dibuat otomatis dari soal. */
export function hintsFor(q) {
  if (q.hints) return q.hints;
  if (q.focus === 'zero') return zeroHints(q.value);
  if (q.focus === 'back' && q.type !== 'to_standard') return hintsFor({ type: 'to_standard', a: q.a, n: q.n });
  if (q.focus === 'compare') return compareHints(q);
  if (q.type === 'place_value') return placeValueHints(q.value, q.pos);
  if (q.type === 'normalize') return normalizeHints(q.a, q.n);
  if (q.type === 'operation') return operationHints(q);
  switch (q.type) {
    case 'to_scientific': {
      const x = parseStandard(q.value);
      const { a, n } = toScientific(x);
      const d = x.digits[0];
      const h2 =
        n < 0
          ? `Angka bukan nol pertama adalah ${d}, ada di posisi ke-${firstNonZeroPosition(q.value)} setelah koma.`
          : `Angka bukan nol pertama adalah ${d}. Taruh koma tepat setelah ${d}.`;
      return [
        'Cari angka bukan nol pertama dari kiri.',
        h2,
        n === 0
          ? `Koma sudah tepat setelah ${d}, jadi tidak perlu melompat. Bentuknya ${a} × 10^(…). Berapa pangkatnya?`
          : `Koma melompat ${Math.abs(n)} kali ke ${dirWord(n)}, jadi bentuknya ${a} × 10^(…). Tanda pangkatnya positif atau negatif?`,
      ];
    }
    case 'to_standard':
    case 'ten_to_standard': {
      const n = q.n;
      const a = q.a ?? '1';
      return [
        n >= 0 ? 'Pangkat positif → bilangannya besar. Koma bergeser ke kanan.' : 'Pangkat negatif → bilangannya kecil (kurang dari 1). Koma bergeser ke kiri.',
        `Mulai dari ${a}. Geser komanya ${Math.abs(n)} kali ke ${n >= 0 ? 'kanan' : 'kiri'}.`,
        n >= 0
          ? `Tambahkan nol di belakang bila angkanya habis. Hasilnya punya ${n + 1} angka sebelum koma.`
          : `Tambahkan nol di depan. Angka ${a[0]} akan berada di posisi ke-${-n} setelah koma.`,
      ];
    }
    case 'power_of_ten': {
      const n = parseStandard(q.value).exp;
      return n >= 0
        ? ['Hitung banyaknya angka nol.', `Ada ${n} angka nol di belakang angka 1.`, `Jadi pangkatnya ${n}. Positif karena bilangannya lebih dari 1.`]
        : [
            'Bilangan ini kurang dari 1, jadi pangkatnya negatif.',
            `Angka 1 ada di posisi ke-${-n} setelah koma.`,
            `Jadi pangkatnya −${-n}.`,
          ];
    }
    default:
      return ['Baca soalnya pelan-pelan.', 'Ingat aturan bentuk baku: a × 10ⁿ dengan 1 ≤ a < 10.', 'Coba buang pilihan yang nilai a-nya tidak di antara 1 dan 10.'];
  }
}

/** Teks soal singkat. */
export function promptText(q) {
  if (q.text) return q.text;
  switch (q.type) {
    case 'to_scientific':
    case 'normalize':
      return 'Tulis dalam bentuk baku:';
    case 'operation':
      return 'Hitung, lalu tulis hasilnya dalam bentuk baku:';
    case 'place_value':
      return `Berapa nilai angka ${placeValueOf(q.value, q.pos).digit} pada bilangan ini?`;
    case 'to_standard':
    case 'ten_to_standard':
      return 'Tulis dalam bentuk biasa:';
    case 'power_of_ten':
      return 'Tulis sebagai 10 pangkat berapa:';
    default:
      return q.text;
  }
}
