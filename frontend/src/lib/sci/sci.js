/**
 * Logika notasi ilmiah (bentuk baku) — TANPA floating point.
 *
 * Representasi internal SciNumber:
 *   { sign: 1 | -1, digits: "135", exp: 8 }
 *   nilai = sign × d1,d2d3… × 10^exp   (digits[0] ≠ "0", tanpa nol di belakang)
 *
 * Format angka Indonesia: koma = desimal, titik = pemisah ribuan.
 * Logika ini harus identik dengan backend/app/sci/core.py
 * (diuji bersama memakai shared/test-vectors.json).
 */

/** @typedef {{sign: 1|-1, digits: string, exp: number}} SciNumber */
/** @typedef {{a: string, n: number}} SciParts */

const THOUSANDS_RE = /^\d{1,3}(\.\d{3})+$/;

function cleanInput(str) {
  return String(str ?? '')
    .replace(/\s+/g, '')
    .replace(/[−–]/g, '-');
}

/**
 * Pecah string desimal menjadi tanda, bagian bulat, dan bagian pecahan.
 * @param {string} str
 * @param {{allowThousands?: boolean}} [opts]
 * @returns {{sign: 1|-1, int: string, frac: string} | null}
 */
export function splitDecimal(str, { allowThousands = true } = {}) {
  let s = cleanInput(str);
  if (!s) return null;
  let sign = 1;
  if (s[0] === '-' || s[0] === '+') {
    if (s[0] === '-') sign = -1;
    s = s.slice(1);
  }
  if (!s) return null;

  let intPart;
  let fracPart = '';
  if (s.includes(',')) {
    const parts = s.split(',');
    if (parts.length !== 2) return null;
    [intPart, fracPart] = parts;
    if (intPart.includes('.')) {
      if (!allowThousands || !THOUSANDS_RE.test(intPart)) return null;
      intPart = intPart.replace(/\./g, '');
    }
  } else if (s.includes('.')) {
    if (allowThousands && THOUSANDS_RE.test(s)) {
      intPart = s.replace(/\./g, '');
    } else {
      const parts = s.split('.');
      if (parts.length !== 2) return null;
      [intPart, fracPart] = parts;
    }
  } else {
    intPart = s;
  }
  if (intPart === '') intPart = '0';
  if (!/^\d+$/.test(intPart) || !/^\d*$/.test(fracPart)) return null;
  if (intPart === '0' && fracPart === '' && s.endsWith(',')) return null;
  return { sign, int: intPart, frac: fracPart };
}

/**
 * Ubah bilangan bentuk biasa (string) menjadi SciNumber. Mengembalikan null bila
 * tidak valid atau bernilai nol (nol tidak punya bentuk baku).
 * @param {string} str
 * @param {{allowThousands?: boolean}} [opts]
 * @returns {SciNumber | null}
 */
export function parseStandard(str, opts) {
  const p = splitDecimal(str, opts);
  if (!p) return null;
  const all = p.int + p.frac;
  const first = all.search(/[1-9]/);
  if (first === -1) return null;
  const exp = p.int.length - 1 - first;
  const digits = all.slice(first).replace(/0+$/, '');
  return { sign: p.sign, digits, exp };
}

/**
 * Bentuk a × 10^n (a dari input siswa) menjadi SciNumber + info kenormalan.
 * Titik ribuan TIDAK diterima di kolom a.
 * @param {string} a
 * @param {number|string} n
 * @returns {{value: SciNumber, normalized: boolean, aValue: SciNumber} | null}
 */
export function parseScientific(a, n) {
  const nn = typeof n === 'number' ? n : Number(cleanInput(n));
  if (!Number.isInteger(nn)) return null;
  const aValue = parseStandard(a, { allowThousands: false });
  if (!aValue) return null;
  return {
    value: { ...aValue, exp: aValue.exp + nn },
    normalized: aValue.exp === 0,
    aValue,
  };
}

/** @param {SciNumber} x @returns {string} mantisa dengan koma desimal */
export function formatMantissa(x) {
  const m = x.digits[0] + (x.digits.length > 1 ? ',' + x.digits.slice(1) : '');
  return (x.sign < 0 ? '-' : '') + m;
}

/** @param {SciNumber} x @returns {SciParts} */
export function toScientific(x) {
  return { a: formatMantissa(x), n: x.exp };
}

/** Sisipkan titik ribuan. @param {string} intDigits */
export function groupThousands(intDigits) {
  return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** @param {SciNumber} x @returns {string} bentuk biasa, format Indonesia */
export function toStandard(x) {
  const { digits, exp } = x;
  let out;
  if (exp >= 0) {
    if (digits.length <= exp + 1) {
      out = groupThousands(digits + '0'.repeat(exp + 1 - digits.length));
    } else {
      out = groupThousands(digits.slice(0, exp + 1)) + ',' + digits.slice(exp + 1);
    }
  } else {
    out = '0,' + '0'.repeat(-exp - 1) + digits;
  }
  return (x.sign < 0 ? '-' : '') + out;
}

/** @param {SciNumber} x @param {SciNumber} y */
export function equalsValue(x, y) {
  return x.sign === y.sign && x.digits === y.digits && x.exp === y.exp;
}

// ---------- Operasi kali / bagi (Modul 7) ----------

function toIntForm(x) {
  // nilai = M × 10^e dengan M bilangan bulat
  return { m: BigInt(x.digits) * BigInt(x.sign), e: x.exp - (x.digits.length - 1) };
}

function fromIntForm(m, e) {
  if (m === 0n) return null;
  const sign = m < 0n ? -1 : 1;
  let s = (m < 0n ? -m : m).toString();
  const trimmed = s.replace(/0+$/, '');
  e += s.length - trimmed.length;
  s = trimmed;
  return { sign, digits: s, exp: e + s.length - 1 };
}

/** @param {SciNumber} x @param {SciNumber} y */
export function multiply(x, y) {
  const a = toIntForm(x);
  const b = toIntForm(y);
  return fromIntForm(a.m * b.m, a.e + b.e);
}

/**
 * Pembagian dengan 20 digit presisi (hasil tak berhingga dibulatkan ke bawah).
 * @param {SciNumber} x @param {SciNumber} y
 */
export function divide(x, y) {
  const a = toIntForm(x);
  const b = toIntForm(y);
  const SCALE = 20;
  const q = (a.m * 10n ** BigInt(SCALE)) / b.m;
  return fromIntForm(q, a.e - b.e - SCALE);
}

// ---------- Info untuk visualisasi & petunjuk ----------

/**
 * Data untuk Visualisasi Geser Koma.
 * @param {string} str bentuk biasa
 * @returns {null | {cells: {d: string, kind: 'lead'|'first'|'sig'|'middle'|'trail'}[],
 *   originalComma: number, targetComma: number, jumps: number, firstIndex: number}}
 *   Posisi koma = indeks celah (0 = sebelum sel pertama, cells.length = setelah sel terakhir).
 *   jumps > 0 → koma ke kiri (pangkat positif); jumps < 0 → ke kanan (pangkat negatif).
 */
export function shiftInfo(str) {
  const p = splitDecimal(str);
  if (!p) return null;
  const all = (p.int + p.frac).split('');
  const firstIndex = all.findIndex((d) => d !== '0');
  if (firstIndex === -1) return null;
  let lastIndex = all.length - 1;
  while (all[lastIndex] === '0') lastIndex--;
  const cells = all.map((d, i) => {
    let kind = 'sig';
    if (i < firstIndex) kind = 'lead';
    else if (i === firstIndex) kind = 'first';
    else if (i > lastIndex) kind = 'trail';
    else if (d === '0') kind = 'middle';
    return { d, kind };
  });
  const originalComma = p.int.length;
  const targetComma = firstIndex + 1;
  return { cells, originalComma, targetComma, jumps: originalComma - targetComma, firstIndex };
}

/**
 * Posisi angka bukan nol pertama setelah koma (untuk bilangan < 1), mis. 0,00032 → 4.
 * @param {string} str
 */
export function firstNonZeroPosition(str) {
  const x = parseStandard(str);
  return x && x.exp < 0 ? -x.exp : null;
}
