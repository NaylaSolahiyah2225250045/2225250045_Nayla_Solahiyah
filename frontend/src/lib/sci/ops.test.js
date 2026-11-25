import { describe, expect, it } from 'vitest';
import {
  compareQuestion,
  compareSteps,
  diagnoseOperation,
  normalizeKey,
  normalizeSteps,
  operationKey,
  operationSteps,
  placeValueOf,
  placeValueSteps,
} from './ops.js';
import { answerKey, checkAnswer, promptText } from './questions.js';

const P = (a, n) => ({ a, n });
const mul = (x, y, extra) => ({ type: 'operation', op: 'kali', x, y, ...extra });
const div = (x, y, extra) => ({ type: 'operation', op: 'bagi', x, y, ...extra });

describe('nilai tempat', () => {
  it.each([
    ['3.725', 2, '7', '700'],
    ['0,486', -2, '8', '0,08'],
    ['52.904', 4, '5', '50.000'],
    ['1.048.576', 6, '1', '1.000.000'],
    ['9.402,1', -1, '1', '0,1'],
  ])('%s di 10^%i → angka %s bernilai %s', (value, pos, digit, answer) => {
    expect(placeValueOf(value, pos)).toEqual({ digit, answer });
  });

  it('langkah & pemeriksa', () => {
    const q = { type: 'place_value', value: '3.725', pos: 2 };
    expect(placeValueSteps('3.725', 2)).toEqual(['Angka 7 ada di tempat ratusan.', 'Nilai tempat ratusan = 10² = 100.', 'Jadi nilai angka 7 = 7 × 100 = 700.']);
    expect(promptText(q)).toBe('Berapa nilai angka 7 pada bilangan ini?');
    expect(checkAnswer(q, '700').correct).toBe(true);
    expect(checkAnswer(q, '70').errorCode).toBe('E-PANGKAT');
    expect(checkAnswer(q, '7').errorCode).toBe('E-PANGKAT');
  });
});

describe('menormalkan', () => {
  it.each([
    ['45', 5, '4,5', 6],
    ['0,6', 4, '6', 3],
    ['360', -7, '3,6', -5],
    ['0,25', -3, '2,5', -4],
  ])('%s × 10^%i = %s × 10^%i', (a, n, ka, kn) => {
    expect(normalizeKey(a, n)).toEqual({ a: ka, n: kn });
  });

  it('langkah & diagnosis', () => {
    expect(normalizeSteps('45', 5)).toEqual([
      '45 lebih dari 10, jadi belum bentuk baku.',
      'Tulis 45 sebagai 4,5 × 10¹.',
      'Gabungkan pangkatnya: 10¹ × 10⁵ = 10 pangkat (1 + 5) = 10⁶.',
      'Jadi 45 × 10⁵ = 4,5 × 10⁶.',
    ]);
    const q = { type: 'normalize', a: '45', n: 5 };
    expect(checkAnswer(q, { a: '4,5', n: '6' }).correct).toBe(true);
    expect(checkAnswer(q, { a: '4,5', n: '5' }).errorCode).toBe('E-PANGKAT');
  });
});

describe('kali & bagi', () => {
  it.each([
    [mul(P('2', 3), P('3', 4)), '6', 7],
    [mul(P('5', 3), P('4', 2)), '2', 6],
    [mul(P('8', -4), P('5', -3)), '4', -6],
    [div(P('8', 6), P('2', 2)), '4', 4],
    [div(P('3', 4), P('6', -3)), '5', 6],
    [div(P('1,2', -5), P('4', 3)), '3', -9],
    [div(P('2,4', 9), P('8', 3)), '3', 5],
  ])('%#: hasil dalam bentuk baku', (q, a, n) => {
    expect(operationKey(q)).toEqual({ a, n });
  });

  it('langkah perkalian dengan normalisasi', () => {
    expect(operationSteps(mul(P('4', 5), P('5', -2)))).toEqual([
      'Kalikan bilangan depannya: 4 × 5 = 20.',
      'Kali → pangkat dijumlah: 5 + (−2) = 3, jadi 10³.',
      '20 belum di antara 1 dan 10: 20 = 2 × 10¹. Pangkatnya ditambah 1 → 10⁴.',
      'Jadi hasilnya 2 × 10⁴.',
    ]);
  });

  it('langkah pembagian (hasil < 1) & satuan', () => {
    const s = operationSteps(div(P('2', 12), P('4', 6), { unit: 'berkas' }));
    expect(s[0]).toBe('Bagi bilangan depannya: 2 : 4 = 0,5.');
    expect(s[1]).toBe('Bagi → pangkat dikurang: 12 − 6 = 6, jadi 10⁶.');
    expect(s[2]).toBe('0,5 kurang dari 1: 0,5 = 5 × 10⁻¹. Pangkatnya dikurangi 1 → 10⁵.');
    expect(s[3]).toBe('Jadi hasilnya 5 × 10⁵ berkas.');
  });

  it('diagnosis: benar, belum baku, salah aturan pangkat, satuan', () => {
    const q = mul(P('4', 3), P('5', 4), { traps: [{ a: '4', n: 3, code: 'E-SATUAN' }] });
    expect(diagnoseOperation(q, { a: '2', n: '8' })).toEqual({ correct: true, errorCode: null });
    expect(diagnoseOperation(q, { a: '20', n: '7' }).errorCode).toBe('E-NORMAL');
    expect(diagnoseOperation(q, { a: '2', n: '12' }).errorCode).toBe('E-OPERASI');
    expect(diagnoseOperation(q, { a: '4', n: '3' }).errorCode).toBe('E-SATUAN');
    expect(diagnoseOperation(q, { a: '', n: '' }).errorCode).toBe('E-FORMAT');
    expect(answerKey(q)).toEqual({ a: '2', n: 8 });
  });
});

describe('membandingkan', () => {
  it('pangkat menentukan, bukan bilangan depannya', () => {
    const q = compareQuestion([P('3,2', 4), P('9,8', 3)], 'besar');
    expect(q.options.find((o) => o.key === q.answer).text).toBe('3,2 × 10⁴');
    expect(compareSteps(q)[0]).toBe('Bandingkan pangkatnya dulu: 10⁴ > 10³.');
  });

  it('pangkat negatif & pangkat sama', () => {
    const neg = compareQuestion([P('5', -3), P('2', -2)], 'kecil');
    expect(neg.options.find((o) => o.key === neg.answer).text).toBe('5 × 10⁻³');
    const same = compareQuestion([P('4,1', -6), P('3,9', -6)], 'besar');
    expect(same.answer).toBe('a');
    expect(compareSteps(same)[0]).toBe('Pangkatnya sama, yaitu 10⁻⁶.');
    const four = compareQuestion([P('2', -3), P('9', -4), P('1', -2), P('5', -5)], 'besar');
    expect(four.options.find((o) => o.key === four.answer).text).toBe('1 × 10⁻²');
  });
});
