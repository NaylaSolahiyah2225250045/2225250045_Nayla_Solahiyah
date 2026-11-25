import { parseStandard, toScientific, firstNonZeroPosition } from './sci.js';
import { powText, sciText } from './format.js';

/** Langkah contoh terurai otomatis untuk soal "tulis dalam bentuk baku". */
export function workedSteps(value) {
  const x = parseStandard(value);
  const { a, n } = toScientific(x);
  const d = x.digits[0];
  const result = `Jadi ${value} = ${sciText(a, n)}.`;
  if (n === 0) {
    return [
      `Angka bukan nol pertama dari kiri adalah ${d}.`,
      `Koma sudah tepat setelah ${d} → ${a}.`,
      'Koma tidak perlu melompat, jadi pangkatnya 0.',
      `Ingat ${powText(0)} = 1. ${result}`,
    ];
  }
  if (n > 0) {
    return [
      `Angka bukan nol pertama dari kiri adalah ${d}.`,
      `Taruh koma tepat setelah ${d} → ${a}.`,
      `Koma melompat ${n} kali ke kiri.`,
      `Ke kiri berarti pangkat positif → ${powText(n)}. ${result}`,
    ];
  }
  const k = firstNonZeroPosition(value);
  return [
    `Angka bukan nol pertama adalah ${d}, di posisi ke-${k} setelah koma.`,
    `Taruh koma tepat setelah ${d} → ${a}.`,
    `Koma melompat ${k} kali ke kanan.`,
    `Ke kanan berarti pangkat negatif → ${powText(n)}. ${result}`,
  ];
}
