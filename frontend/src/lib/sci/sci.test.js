import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  parseStandard,
  parseScientific,
  toScientific,
  toStandard,
  multiply,
  divide,
  diagnoseToScientific,
  diagnoseToStandard,
  diagnosePowerOfTen,
  shiftInfo,
  workedSteps,
} from './index.js';

// Kasus uji bersama dengan backend (backend/tests/test_sci_vectors.py)
const V = JSON.parse(readFileSync(new URL('../../../../shared/test-vectors.json', import.meta.url), 'utf8'));
const sci = (p) => parseScientific(p.a, p.n).value;

describe('konversi', () => {
  it.each(V.conversions)('$standard → bentuk baku', (c) => {
    expect(toScientific(parseStandard(c.standard))).toEqual({ a: c.a, n: c.n });
  });
  it.each(V.conversions)('$a × 10^$n → $standard', (c) => {
    const p = parseScientific(c.a, c.n);
    expect(p.normalized).toBe(true);
    expect(toStandard(p.value)).toBe(c.standard);
  });
  it.each(V.parse_equivalents)('"$input" setara "$same_as"', (c) => {
    expect(parseStandard(c.input)).toEqual(parseStandard(c.same_as));
  });
  it.each(V.parse_invalid.map((s) => [s]))('"%s" tidak valid', (s) => {
    expect(parseStandard(s)).toBeNull();
  });
});

describe('diagnosis', () => {
  it.each(V.diagnosis_to_scientific)('$question | $answer.a × 10^$answer.n → $expected', (c) => {
    const d = diagnoseToScientific(c.question, c.answer);
    expect(d.errorCode).toBe(c.expected);
    expect(d.correct).toBe(c.expected === null);
  });
  it.each(V.diagnosis_to_standard)('$a × 10^$n | "$answer" → $expected', (c) => {
    expect(diagnoseToStandard({ a: c.a, n: c.n }, c.answer).errorCode).toBe(c.expected);
  });
  it('pangkat 10', () => {
    expect(diagnosePowerOfTen('0,001', '-3').correct).toBe(true);
    expect(diagnosePowerOfTen('0,001', '−3').correct).toBe(true);
    expect(diagnosePowerOfTen('0,001', '3').errorCode).toBe('E-TANDA');
    expect(diagnosePowerOfTen('1.000.000', '5').errorCode).toBe('E-PANGKAT');
    expect(diagnosePowerOfTen('1.000.000', 'x').errorCode).toBe('E-FORMAT');
  });
});

describe('operasi', () => {
  it.each(V.operations)('$op', (c) => {
    const r = c.op === 'mul' ? multiply(sci(c.x), sci(c.y)) : divide(sci(c.x), sci(c.y));
    expect(toScientific(r)).toEqual(c.result);
  });
});

describe('visualisasi & langkah', () => {
  it('bilangan besar: koma melompat ke kiri', () => {
    const s = shiftInfo('135.000.000');
    expect(s.jumps).toBe(8);
    expect(s.cells.at(-1).kind).toBe('trail');
  });
  it('bilangan kecil: koma melompat ke kanan, nol depan ditandai', () => {
    const s = shiftInfo('0,00032');
    expect(s.jumps).toBe(-4);
    expect(s.cells.slice(0, 4).every((c) => c.kind === 'lead')).toBe(true);
    expect(s.cells[4].kind).toBe('first');
  });
  it('nol di tengah ditandai', () => {
    expect(shiftInfo('70.080.000').cells.map((c) => c.kind)).toEqual(['first', 'middle', 'middle', 'sig', 'trail', 'trail', 'trail', 'trail']);
  });
  it('langkah contoh terurai memuat jawaban yang benar', () => {
    expect(workedSteps('0,00032').at(-1)).toContain('3,2 × 10⁻⁴');
    expect(workedSteps('135.000.000').at(-1)).toContain('1,35 × 10⁸');
  });
});
