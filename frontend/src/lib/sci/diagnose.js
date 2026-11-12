import { parseStandard, parseScientific, equalsValue } from './sci.js';

/**
 * Kode kesalahan (lihat docs/FEATURES.md F-07).
 * @typedef {'E-FORMAT'|'E-KOMA'|'E-NOL'|'E-TANDA'|'E-PANGKAT'|'E-LAIN'} ErrorCode
 * @typedef {{correct: boolean, errorCode: ErrorCode | null}} Diagnosis
 */

const MAX_EXP_DIFF = 2;

const stripZeros = (s) => s.replace(/0/g, '');

/**
 * Bandingkan digit & pangkat dua SciNumber yang nilainya berbeda.
 * @returns {ErrorCode}
 */
function classify(key, ans) {
  if (ans.digits !== key.digits && key.digits.includes('0') && stripZeros(ans.digits) === stripZeros(key.digits)) {
    return 'E-NOL';
  }
  if (ans.digits === key.digits && ans.sign === key.sign) {
    if (key.exp !== 0 && ans.exp === -key.exp) return 'E-TANDA';
    if (Math.abs(ans.exp - key.exp) <= MAX_EXP_DIFF) return 'E-PANGKAT';
  }
  return 'E-LAIN';
}

/**
 * Soal "tulis dalam bentuk baku".
 * @param {string} question bilangan bentuk biasa, mis. "0,0000075"
 * @param {{a: string, n: number|string}} answer
 * @returns {Diagnosis}
 */
export function diagnoseToScientific(question, answer) {
  const key = parseStandard(question);
  if (!key) throw new Error(`Soal tidak valid: ${question}`);
  const parsed = parseScientific(answer?.a, answer?.n);
  if (!parsed) return { correct: false, errorCode: 'E-FORMAT' };
  const { value, normalized, aValue } = parsed;

  if (equalsValue(value, key)) {
    return normalized ? { correct: true, errorCode: null } : { correct: false, errorCode: 'E-KOMA' };
  }
  if (!normalized) {
    // a di luar [1, 10): koma salah tempat (meskipun nilainya juga salah)
    return { correct: false, errorCode: aValue.digits === key.digits ? 'E-KOMA' : classify(key, value) };
  }
  return { correct: false, errorCode: classify(key, value) };
}

/**
 * Soal "tulis dalam bentuk biasa".
 * @param {{a: string, n: number}} question
 * @param {string} answer
 * @returns {Diagnosis}
 */
export function diagnoseToStandard(question, answer) {
  const q = parseScientific(question.a, question.n);
  if (!q) throw new Error('Soal tidak valid');
  const ans = parseStandard(answer);
  if (!ans) return { correct: false, errorCode: 'E-FORMAT' };
  if (equalsValue(ans, q.value)) return { correct: true, errorCode: null };
  return { correct: false, errorCode: classify(q.value, ans) };
}

/**
 * Soal "10^n": siswa mengisi pangkat saja, mis. 0,001 = 10^…
 * @param {string} question bilangan yang merupakan pangkat 10
 * @param {number|string} n
 * @returns {Diagnosis}
 */
export function diagnosePowerOfTen(question, n) {
  const key = parseStandard(question);
  const nn = Number(String(n ?? '').replace(/[−–]/g, '-').trim());
  if (String(n ?? '').trim() === '' || !Number.isInteger(nn)) return { correct: false, errorCode: 'E-FORMAT' };
  if (nn === key.exp) return { correct: true, errorCode: null };
  if (key.exp !== 0 && nn === -key.exp) return { correct: false, errorCode: 'E-TANDA' };
  if (Math.abs(nn - key.exp) <= MAX_EXP_DIFF) return { correct: false, errorCode: 'E-PANGKAT' };
  return { correct: false, errorCode: 'E-LAIN' };
}
