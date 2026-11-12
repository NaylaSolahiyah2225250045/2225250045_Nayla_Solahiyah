/**
 * Langkah penyelesaian & petunjuk untuk Modul 4 (Nol di Tengah) dan Modul 5 (Kembali ke Bentuk Biasa).
 * Murni (tanpa React), TANPA floating point: semua angka dihitung dari string digit + pangkat bulat.
 * Dipakai bila soal/item diberi `focus: 'zero'` atau `focus: 'back'`, sehingga Modul 1–3 tidak berubah.
 */
import { parseStandard, parseScientific, shiftInfo, toScientific, toStandard } from './sci.js';
import { sciText, powText, fmtSigned } from './format.js';
import { workedSteps } from './worked.js';

/**
 * Peran setiap angka nol pada bilangan bentuk biasa.
 * @typedef {{ lead: number, middle: number, trail: number, first: string, last: string, digits: string, a: string, n: number }} ZeroRoles
 * @param {string} value bentuk biasa, mis. "70.080.000"
 * @returns {ZeroRoles | null}
 */
export function zeroRoles(value) {
  const info = shiftInfo(value);
  const x = parseStandard(value);
  if (!info || !x) return null;
  const count = (kind) => info.cells.filter((c) => c.kind === kind && c.d === '0').length;
  const { a, n } = toScientific(x);
  return {
    lead: count('lead'),
    middle: count('middle'),
    trail: count('trail'),
    first: x.digits[0],
    last: x.digits[x.digits.length - 1],
    digits: x.digits,
    a,
    n,
  };
}

/** Kalimat tentang nol yang dibuang (depan/belakang), atau '' bila tidak ada. */
function droppedText(r) {
  if (r.lead && r.trail) return ' Nol depan dan nol belakang dibuang.';
  if (r.lead) return ' Nol depan dibuang (hanya menentukan pangkat).';
  if (r.trail) return ' Nol belakang dibuang.';
  return '';
}

/**
 * Contoh terurai "tulis dalam bentuk baku" yang menyorot peran angka nol (5 langkah).
 * Dua langkah terakhir sama persis dengan workedSteps() agar istilahnya konsisten dengan Modul 2–3.
 * @param {string} value
 * @returns {string[]}
 */
export function zeroSteps(value) {
  const r = zeroRoles(value);
  const base = workedSteps(value);
  const keep =
    r.digits.length === 1
      ? `Hanya ada satu angka bukan nol, yaitu ${r.first}.`
      : r.middle > 0
        ? `Angka dari ${r.first} sampai ${r.last} ditulis semua, termasuk ${r.middle} nol di tengah: ${r.digits}.`
        : `Angka dari ${r.first} sampai ${r.last}: ${r.digits}.`;
  return [
    r.digits.length === 1
      ? `Angka bukan nol pertama adalah ${r.first}.`
      : `Angka bukan nol pertama adalah ${r.first}, angka bukan nol terakhir adalah ${r.last}.`,
    keep + droppedText(r),
    `Taruh koma tepat setelah ${r.first} → a = ${r.a}.`,
    base[2],
    base[3],
  ];
}

/**
 * Petunjuk bertingkat untuk soal nol di tengah (hint ke-3 = hampir lengkap).
 * @param {string} value
 */
export function zeroHints(value) {
  const r = zeroRoles(value);
  const dir = r.n >= 0 ? 'kiri' : 'kanan';
  return [
    'Cari angka bukan nol pertama dan angka bukan nol terakhir.',
    `Nol di antara ${r.first} dan ${r.last} tetap ditulis. Nol di depan atau di belakang dibuang.`,
    `Jadi a = ${r.a}. Koma melompat ${Math.abs(r.n)} kali ke ${dir}. Tanda pangkatnya positif atau negatif?`,
  ];
}

/**
 * Hasil bentuk biasa dari a × 10ⁿ.
 * @param {string} a @param {number} n
 */
export function backResult(a, n) {
  const p = parseScientific(a, n);
  return p ? toStandard(p.value) : null;
}

/**
 * Contoh terurai "tulis dalam bentuk biasa" (4 langkah, n ≠ 0).
 * @param {string} a mantisa ternormalisasi, mis. "6,02"
 * @param {number} n pangkat
 * @returns {string[]}
 */
export function backSteps(a, n) {
  const p = parseScientific(a, n);
  if (!p) throw new Error(`Bentuk baku tidak valid: ${a} × 10^${n}`);
  const result = toStandard(p.value);
  const sci = sciText(a, n);
  const d = p.aValue.digits[0];
  if (n === 0) {
    return [`Pangkatnya 0, dan ${powText(0)} = 1.`, 'Koma tidak bergeser.', 'Tidak ada nol yang perlu ditambah.', `Jadi ${sci} = ${result}.`];
  }
  if (n > 0) {
    const f = p.aValue.digits.length - 1; // banyak angka di belakang koma pada a
    let fill;
    if (f === 0) fill = `${a} tidak punya angka di belakang koma, jadi setiap lompatan menambah satu nol: ${n} nol.`;
    else if (f < n) fill = `${a} punya ${f} angka di belakang koma. Koma melewati angka itu dulu, lalu ${n - f} lompatan sisanya menambah ${n - f} nol.`;
    else if (f === n) fill = `${a} punya ${f} angka di belakang koma. Koma tepat sampai di ujung, jadi tidak perlu menambah nol.`;
    else fill = `Koma berhenti setelah ${n} angka di belakang koma. Tidak perlu menambah nol.`;
    return [
      `Pangkatnya ${n} (positif), jadi bilangannya besar. Koma bergeser ${n} kali ke kanan.`,
      fill,
      result.includes('.') ? `Tulis angkanya dengan titik ribuan → ${result}.` : `Tulis angkanya → ${result}.`,
      `Jadi ${sci} = ${result}. Cek: ada ${n + 1} angka sebelum koma ✓`,
    ];
  }
  const m = -n;
  return [
    `Pangkatnya ${fmtSigned(n)} (negatif), jadi bilangannya kecil. Koma bergeser ${m} kali ke kiri.`,
    m === 1
      ? `Satu lompatan melewati angka ${d}. Tidak perlu nol tambahan setelah koma.`
      : `Lompatan pertama melewati angka ${d}. Sisa ${m - 1} lompatan menambah ${m - 1} nol di depan.`,
    `Tulis 0 di depan koma → ${result}.`,
    `Jadi ${sci} = ${result}. Cek: angka ${d} ada di posisi ke-${m} setelah koma ✓`,
  ];
}
