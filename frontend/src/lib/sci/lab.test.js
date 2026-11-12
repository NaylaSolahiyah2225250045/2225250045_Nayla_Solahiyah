import { describe, expect, it } from 'vitest';
import { prepareLab, randomLabNumber, readAt } from './lab.js';
import { equalsValue, parseStandard } from './sci.js';

const lab = (s) => {
  const r = prepareLab(s);
  if (!r.ok) throw new Error(`${s}: ${r.error}`);
  return r.lab;
};

describe('prepareLab', () => {
  it('menerima bilangan besar & kecil', () => {
    expect(lab('4.500.000').originalComma).toBe(7);
    expect(lab('4.500.000').targetComma).toBe(1);
    expect(lab('0,00032').originalComma).toBe(1);
    expect(lab('0,00032').targetComma).toBe(5);
  });

  it('menolak input kosong, salah format, nol, negatif, dan terlalu panjang', () => {
    expect(prepareLab('').error).toBe('kosong');
    expect(prepareLab('abc').error).toBe('format');
    expect(prepareLab('0,000').error).toBe('nol');
    expect(prepareLab('-45').error).toBe('negatif');
    expect(prepareLab('12345678901234567').error).toBe('panjang');
  });
});

describe('readAt', () => {
  it('membaca bilangan & pangkat di setiap posisi koma', () => {
    const L = lab('4.500.000');
    expect(readAt(L, 7)).toMatchObject({ text: '4.500.000', k: 0, state: 'big', stepsLeft: 6 });
    expect(readAt(L, 4)).toMatchObject({ text: '4.500', k: 3, state: 'big' });
    expect(readAt(L, 1)).toMatchObject({ text: '4,5', k: 6, state: 'normal', stepsLeft: 0 });
    expect(readAt(L, 0)).toMatchObject({ text: '0,45', k: 7, state: 'small', stepsLeft: -1 });

    const S = lab('0,00032');
    expect(readAt(S, 1)).toMatchObject({ text: '0,00032', k: 0, state: 'small', stepsLeft: -4 });
    expect(readAt(S, 5)).toMatchObject({ text: '3,2', k: -4, state: 'normal' });
    expect(readAt(S, 6)).toMatchObject({ text: '32', k: -5, state: 'big' });
  });

  it('nilai selalu tetap: bacaan × 10^k = bilangan asal (semua posisi)', () => {
    for (const s of ['4.500.000', '0,00032', '150.000.000', '0,0000075', '12,05', '7', '0,5', '6.020.000.000']) {
      const L = lab(s);
      const orig = parseStandard(s);
      for (let p = 0; p <= L.cells.length; p++) {
        const r = readAt(L, p);
        const x = parseStandard(r.text);
        expect(equalsValue({ ...x, exp: x.exp + r.k }, orig)).toBe(true);
        expect(r.state === 'normal').toBe(x.exp === 0);
      }
    }
  });
});

describe('randomLabNumber', () => {
  it('selalu menghasilkan bilangan valid untuk Lab', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 200; i++) expect(prepareLab(randomLabNumber(rnd)).ok).toBe(true);
  });
});
