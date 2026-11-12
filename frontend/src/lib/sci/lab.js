/**
 * Logika Lab Koma — TANPA floating point (string digit + eksponen integer).
 *
 * Bilangan positif ditulis sebagai deretan digit D dengan koma asal di celah o.
 * Bila koma dipindah ke celah p, bilangan yang terbaca dikalikan 10^k dengan
 * k = o − p agar NILAINYA TETAP SAMA:
 *   geser ke kiri 1 langkah → bilangan 10× lebih kecil → pangkat 10 naik 1.
 */
import { groupThousands, parseStandard, shiftInfo, toStandard } from './sci.js';

export const LAB_MAX_DIGITS = 12;

/**
 * @typedef {'normal'|'big'|'small'} LabState
 *   normal: 1 ≤ a < 10 (bentuk baku) · big: a ≥ 10 · small: a < 1
 * @typedef {{ text: string, k: number, state: LabState, stepsLeft: number, p: number }} CommaReading
 *   stepsLeft > 0: masih perlu geser ke kiri; < 0: ke kanan; 0: sudah bentuk baku.
 */

/**
 * Siapkan bilangan untuk Lab Koma.
 * @param {string} input bentuk biasa, mis. "4.500.000" atau "0,00032"
 * @returns {{ ok: true, lab: { value: string, cells: {d:string, kind:string}[], originalComma: number, targetComma: number, firstIndex: number } }
 *   | { ok: false, error: 'kosong'|'format'|'nol'|'negatif'|'panjang' }}
 */
export function prepareLab(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { ok: false, error: 'kosong' };
  if (/^[-−–]/.test(raw)) return { ok: false, error: 'negatif' };
  const x = parseStandard(raw);
  const info = shiftInfo(raw);
  if (!info) return { ok: false, error: x === null && /^[0.,\s]+$/.test(raw) ? 'nol' : 'format' };
  if (!x) return { ok: false, error: 'nol' };
  if (info.cells.length > LAB_MAX_DIGITS) return { ok: false, error: 'panjang' };
  return {
    ok: true,
    lab: {
      value: toStandard(x),
      cells: info.cells,
      originalComma: info.originalComma,
      targetComma: info.targetComma,
      firstIndex: info.firstIndex,
    },
  };
}

/**
 * Bacaan bilangan bila koma berada di celah p.
 * @param {{cells:{d:string}[], originalComma:number, targetComma:number}} lab
 * @param {number} p 0 … cells.length
 * @returns {CommaReading}
 */
export function readAt(lab, p) {
  const n = lab.cells.length;
  const pos = Math.max(0, Math.min(n, p));
  const D = lab.cells.map((c) => c.d).join('');
  const int = D.slice(0, pos).replace(/^0+/, '') || '0';
  const frac = D.slice(pos).replace(/0+$/, '');
  const text = groupThousands(int) + (frac ? `,${frac}` : '');
  const stepsLeft = pos - lab.targetComma;
  return {
    text,
    k: lab.originalComma - pos,
    state: stepsLeft === 0 ? 'normal' : stepsLeft > 0 ? 'big' : 'small',
    stepsLeft,
    p: pos,
  };
}

/**
 * Bilangan acak untuk dicoba (besar atau kecil), dibangun dari digit & pangkat bulat.
 * @param {() => number} [rnd] sumber acak 0 ≤ r < 1 (bisa diganti saat pengujian)
 */
export function randomLabNumber(rnd = Math.random) {
  const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const sigCount = int(1, 3);
  let digits = String(int(1, 9));
  for (let i = 1; i < sigCount; i++) digits += String(int(0, 9));
  digits = digits.replace(/0+$/, '') || '1';
  const big = rnd() < 0.5;
  const exp = big ? int(3, 9) : -int(2, 7);
  return toStandard({ sign: 1, digits, exp });
}
