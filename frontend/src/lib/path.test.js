import { describe, expect, it } from 'vitest';
import { buildPath, nodeLabel, nodeRoute, nodeStatuses, practiceNodeId, toPracticeNodeId } from './path.js';
import { MODULES } from '../content/modules.js';
import { isPassed } from '../content/bank.js';
import { BADGES, summarize } from './rewards.js';
import { explanationFor, responseText } from './sci/index.js';

const nodes = buildPath(MODULES);
const prog = (map) => (id) => ({ levelUnlocked: 1, completed: false, practiceDone: false, ...(map[id] ?? {}) });

describe('jalur latihan (1 latihan × 10 soal per topik, 23 Nov 2026)', () => {
  it('satu titik latihan untuk setiap topik, lalu satu Kuis Akhir di ujung', () => {
    expect(MODULES).toHaveLength(5);
    expect(nodes).toHaveLength(5 + 1);
    expect(nodes.slice(0, 5).map((n) => n.id)).toEqual(['t1-latihan', 't2-latihan', 't3-latihan', 't4-latihan', 't5-latihan']);
    expect(nodes[0]).toMatchObject({ kind: 'level', level: 1, title: 'Latihan', subtitle: '10 soal' });
    expect(nodes.at(-1)).toMatchObject({ id: 'kuis-akhir', kind: 'final', moduleId: 'final', level: 5, subtitle: 'Kuis Akhir' });
  });

  it('pengguna baru: latihan Topik 1 sedang dikerjakan, sisanya terkunci', () => {
    const st = nodeStatuses(nodes, prog({}));
    expect(st['t1-latihan']).toBe('current');
    expect(st['t2-latihan']).toBe('locked');
    expect(st['kuis-akhir']).toBe('locked');
  });

  it('latihan selesai: penanda practiceDone, riwayat lulus, atau kuis topik dikerjakan', () => {
    const st = nodeStatuses(nodes, prog({ t1: { practiceDone: true }, t2: { completed: true } }), new Set(['t3-latihan']));
    expect([st['t1-latihan'], st['t2-latihan'], st['t3-latihan'], st['t4-latihan']]).toEqual(['done', 'done', 'done', 'current']);
  });

  it('siswa lama: yang menuntaskan Level 4 lama tetap selesai; yang baru setengah jalan mulai latihan baru', () => {
    // pernah lulus t1-l4 (riwayat lama) → selesai; levelUnlocked lama tidak lagi dianggap selesai
    const st = nodeStatuses(nodes, prog({ t1: { levelUnlocked: 4 }, t2: { levelUnlocked: 3 } }), new Set(['t1-l4', 't2-l2']));
    expect(st['t1-latihan']).toBe('done');
    expect(st['t2-latihan']).toBe('current');
  });

  it('tautan lama "t2-l3" dialihkan ke latihan topiknya', () => {
    expect(toPracticeNodeId('t2-l3')).toBe('t2-latihan');
    expect(toPracticeNodeId('t5-l1')).toBe('t5-latihan');
    expect(toPracticeNodeId('kuis-akhir')).toBe('kuis-akhir');
    expect(practiceNodeId('t4')).toBe('t4-latihan');
  });

  it('lulus = 60% dari banyak soal sesi itu (sesi lama & baru)', () => {
    expect([isPassed(3, 5), isPassed(3, 4), isPassed(6, 10)]).toEqual([true, true, true]);
    expect([isPassed(2, 5), isPassed(5, 10), isPassed(0, 0)]).toEqual([false, false, false]);
  });

  it('Kuis Akhir terbuka setelah semua latihan topik selesai, dan selesai setelah dikerjakan', () => {
    const allDone = prog(Object.fromEntries(MODULES.map((m) => [m.id, { practiceDone: true }])));
    expect(nodeStatuses(nodes, allDone)['kuis-akhir']).toBe('current');
    const withFinal = (id) => (id === 'final' ? { levelUnlocked: 1, completed: true } : allDone(id));
    expect(nodeStatuses(nodes, withFinal)['kuis-akhir']).toBe('done');
  });

  it('label & alamat titik', () => {
    expect(nodeLabel(nodes[1])).toBe('Topik 2 · Latihan 10 soal');
    expect(nodeRoute(nodes[0])).toBe('/latihan/t1-latihan');
    expect(nodeRoute(nodes.at(-1))).toBe('/kuis-akhir');
  });

  it('lencana "Sampai Level Mahir": lama tetap diraih, baru diraih dengan lulus latihan 4 topik', () => {
    const badge = BADGES.find((b) => b.id === 'level-mahir');
    expect(badge.value(summarize({ t1: { levelUnlocked: 4 } }))).toBeGreaterThanOrEqual(badge.goal);
    const four = Object.fromEntries(['t1', 't2', 't3', 't4'].map((t) => [t, { levelUnlocked: 2, practiceDone: true }]));
    expect(badge.value(summarize(four))).toBeGreaterThanOrEqual(badge.goal);
    expect(badge.value(summarize({ t1: { levelUnlocked: 2, practiceDone: true } }))).toBeLessThan(badge.goal);
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
