/**
 * Penjelasan & teks jawaban untuk pembahasan (Latihan, Riwayat). Murni, tanpa floating point.
 */
import { hintsFor } from './questions.js';
import { workedSteps } from './worked.js';
import { sciText } from './format.js';
import { zeroSteps, backSteps } from './steps.js';

/**
 * Langkah penjelasan untuk satu soal (ditampilkan di bawah soal bila jawaban salah).
 * @returns {string[]}
 */
export function explanationFor(q) {
  if (q.explain) return [].concat(q.explain);
  if (q.focus === 'zero') return zeroSteps(q.value);
  if (q.focus === 'back') return backSteps(q.a, q.n);
  switch (q.type) {
    case 'to_scientific':
      return workedSteps(q.value);
    default:
      return hintsFor(q);
  }
}

/**
 * Jawaban siswa dalam bentuk teks yang bisa dibaca.
 * @param {object} q soal @param {any} response jawaban mentah dari input
 */
export function responseText(q, response) {
  if (response === null || response === undefined) return '(tidak dijawab)';
  switch (q.type) {
    case 'to_scientific': {
      const a = String(response.a ?? '').trim();
      const n = String(response.n ?? '').trim();
      if (!a && !n) return '(kosong)';
      return sciText(a || '…', n || '…');
    }
    case 'power_of_ten': {
      const n = String(response).trim();
      return n ? `10${sciText('', n).replace(/^ × 10/, '')}` : '(kosong)';
    }
    case 'choose_correct':
      return q.options.find((o) => o.key === response)?.text ?? '(belum memilih)';
    default:
      return String(response).trim() || '(kosong)';
  }
}
