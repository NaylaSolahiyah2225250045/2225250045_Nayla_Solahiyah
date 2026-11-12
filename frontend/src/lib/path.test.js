import { describe, expect, it } from 'vitest';
import { buildPath, nodeStatuses } from './path.js';
import { MODULES } from '../content/modules.js';
import { explanationFor, responseText } from './sci/index.js';

const nodes = buildPath(MODULES);
const prog = (map) => (id) => ({ levelUnlocked: 1, completed: false, ...(map[id] ?? {}) });

describe('jalur latihan', () => {
  it('5 titik per modul yang tersedia (Level 1–4 + kuis)', () => {
    expect(nodes).toHaveLength(MODULES.filter((m) => !m.comingSoon).length * 5);
    expect(nodes[4]).toMatchObject({ id: 'm1-kuis', kind: 'kuis' });
  });

  it('pengguna baru: titik pertama sedang dikerjakan, sisanya terkunci', () => {
    const st = nodeStatuses(nodes, prog({}));
    expect(st['m1-l1']).toBe('current');
    expect(st['m1-l2']).toBe('locked');
  });

  it('level yang terbuka & modul selesai menandai titik selesai', () => {
    const st = nodeStatuses(nodes, prog({ m1: { levelUnlocked: 3 } }), new Set());
    expect([st['m1-l1'], st['m1-l2'], st['m1-l3']]).toEqual(['done', 'done', 'current']);
    const st2 = nodeStatuses(nodes, prog({ m1: { completed: true } }), new Set(['m2-l1']));
    expect(st2['m1-kuis']).toBe('done');
    expect(st2['m2-l1']).toBe('done');
    expect(st2['m2-l2']).toBe('current');
  });
});

describe('pembahasan', () => {
  it('penjelasan & teks jawaban siswa', () => {
    expect(explanationFor({ type: 'to_scientific', value: '4.500.000' }).at(-1)).toMatch(/4,5 × 10⁶/);
    expect(explanationFor({ type: 'ten_to_standard', n: 3 }).length).toBe(3);
    expect(responseText({ type: 'to_scientific' }, { a: '45', n: '5' })).toBe('45 × 10⁵');
    expect(responseText({ type: 'to_scientific' }, { a: '3,2', n: '-4' })).toBe('3,2 × 10⁻⁴');
    expect(responseText({ type: 'power_of_ten' }, '-3')).toBe('10⁻³');
    expect(responseText({ type: 'choose_correct', options: [{ key: 'a', text: '0,001' }] }, 'a')).toBe('0,001');
    expect(responseText({ type: 'to_standard' }, ' 23.000 ')).toBe('23.000');
  });
});
