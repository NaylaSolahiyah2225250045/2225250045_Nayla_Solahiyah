import { describe, expect, it } from 'vitest';
import { zeroRoles, zeroSteps, zeroHints, backSteps, backResult } from './steps.js';
import { workedSteps } from './worked.js';
import { explanationFor } from './explain.js';
import { hintsFor } from './questions.js';

describe('Modul 4: peran angka nol', () => {
  it.each([
    ['70.080.000', { lead: 0, middle: 2, trail: 4, digits: '7008', a: '7,008', n: 7 }],
    ['0,000506', { lead: 4, middle: 1, trail: 0, digits: '506', a: '5,06', n: -4 }],
    ['3.004.000', { lead: 0, middle: 2, trail: 3, digits: '3004', a: '3,004', n: 6 }],
    ['0,0302', { lead: 2, middle: 1, trail: 0, digits: '302', a: '3,02', n: -2 }],
    ['105', { lead: 0, middle: 1, trail: 0, digits: '105', a: '1,05', n: 2 }],
  ])('%s', (value, expected) => {
    expect(zeroRoles(value)).toMatchObject(expected);
  });

  it('langkah menyebut semua angka a (termasuk nol tengah) dan berakhir sama dengan Modul 2–3', () => {
    const s = zeroSteps('70.080.000');
    expect(s).toHaveLength(5);
    expect(s[0]).toBe('Angka bukan nol pertama adalah 7, angka bukan nol terakhir adalah 8.');
    expect(s[1]).toBe('Angka dari 7 sampai 8 ditulis semua, termasuk 2 nol di tengah: 7008. Nol belakang dibuang.');
    expect(s[2]).toBe('Taruh koma tepat setelah 7 → a = 7,008.');
    expect(s.slice(3)).toEqual(workedSteps('70.080.000').slice(2));
    expect(s[4]).toContain('7,008 × 10⁷');
  });

  it('bilangan kecil: nol depan dibuang', () => {
    const s = zeroSteps('0,000506');
    expect(s[1]).toBe('Angka dari 5 sampai 6 ditulis semua, termasuk 1 nol di tengah: 506. Nol depan dibuang (hanya menentukan pangkat).');
    expect(s[4]).toContain('5,06 × 10⁻⁴');
  });

  it('petunjuk bertingkat (3) dengan hint ke-3 hampir lengkap', () => {
    const h = zeroHints('0,0010203');
    expect(h).toHaveLength(3);
    expect(h[2]).toBe('Jadi a = 1,0203. Koma melompat 3 kali ke kanan. Tanda pangkatnya positif atau negatif?');
  });
});

describe('Modul 5: kembali ke bentuk biasa', () => {
  it.each([
    ['1,2', 5, '120.000'],
    ['2,5', 8, '250.000.000'],
    ['3,456', 2, '345,6'],
    ['6,02', -3, '0,00602'],
    ['9,0387', -9, '0,0000000090387'],
    ['7', -5, '0,00007'],
    ['4,08', 6, '4.080.000'],
    ['1,5', 11, '150.000.000.000'],
  ])('%s × 10^%i = %s', (a, n, expected) => {
    expect(backResult(a, n)).toBe(expected);
    const s = backSteps(a, n);
    expect(s).toHaveLength(4);
    expect(s[3]).toContain(`= ${expected}`);
  });

  it('pangkat positif: menghitung nol tambahan', () => {
    expect(backSteps('2,5', 8)[1]).toBe('2,5 punya 1 angka di belakang koma. Koma melewati angka itu dulu, lalu 7 lompatan sisanya menambah 7 nol.');
    expect(backSteps('7', 6)[1]).toBe('7 tidak punya angka di belakang koma, jadi setiap lompatan menambah satu nol: 6 nol.');
    expect(backSteps('3,456', 2)[1]).toBe('Koma berhenti setelah 2 angka di belakang koma. Tidak perlu menambah nol.');
    expect(backSteps('1,25', 2)[1]).toBe('1,25 punya 2 angka di belakang koma. Koma tepat sampai di ujung, jadi tidak perlu menambah nol.');
    expect(backSteps('1,2', 5)[3]).toBe('Jadi 1,2 × 10⁵ = 120.000. Cek: ada 6 angka sebelum koma ✓');
  });

  it('pangkat negatif: nol di depan & posisi angka pertama', () => {
    const s = backSteps('6,02', -3);
    expect(s[0]).toBe('Pangkatnya −3 (negatif), jadi bilangannya kecil. Koma bergeser 3 kali ke kiri.');
    expect(s[1]).toBe('Lompatan pertama melewati angka 6. Sisa 2 lompatan menambah 2 nol di depan.');
    expect(s[3]).toBe('Jadi 6,02 × 10⁻³ = 0,00602. Cek: angka 6 ada di posisi ke-3 setelah koma ✓');
    expect(backSteps('8', -1)[1]).toBe('Satu lompatan melewati angka 8. Tidak perlu nol tambahan setelah koma.');
  });
});

describe('focus hanya mengubah soal Modul 4–5', () => {
  it('soal tanpa focus tetap memakai penjelasan lama', () => {
    expect(explanationFor({ type: 'to_scientific', value: '0,0405' })).toEqual(workedSteps('0,0405'));
    expect(explanationFor({ type: 'to_standard', a: '3', n: -2 })).toEqual(hintsFor({ type: 'to_standard', a: '3', n: -2 }));
  });

  it('soal ber-focus memakai langkah khusus', () => {
    expect(explanationFor({ type: 'to_scientific', value: '3.004.000', focus: 'zero' })).toEqual(zeroSteps('3.004.000'));
    expect(explanationFor({ type: 'to_standard', a: '6,02', n: -3, focus: 'back' })).toEqual(backSteps('6,02', -3));
    const mc = { type: 'choose_correct', focus: 'back', a: '4,05', n: -3, options: [], answer: 'b' };
    expect(hintsFor(mc)).toEqual(hintsFor({ type: 'to_standard', a: '4,05', n: -3 }));
  });
});
