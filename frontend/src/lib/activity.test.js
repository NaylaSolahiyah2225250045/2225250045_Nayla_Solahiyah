import { describe, expect, it } from 'vitest';
import { addActivity, computeStreak, dateKey } from './activity.js';
import { makeSession, wrongItems } from './history.js';

describe('log aktivitas belajar', () => {
  it('menjumlah per jenis & per tanggal, label unik', () => {
    let s = { days: {} };
    s = addActivity(s, 'materi', { label: 'Bab 1' }, '2026-11-10');
    s = addActivity(s, 'materi', { label: 'Bab 1' }, '2026-11-10');
    s = addActivity(s, 'latihan', { count: 5, correct: 3, label: 'M2 · Level 1' }, '2026-11-10');
    expect(s.days['2026-11-10'].materi).toEqual({ count: 2, correct: 0, labels: ['Bab 1'] });
    expect(s.days['2026-11-10'].latihan).toMatchObject({ count: 5, correct: 3 });
    expect(Object.keys(s.days)).toEqual(['2026-11-10']);
  });

  it('menolak jenis aktivitas yang tidak dikenal (mis. sekadar membuka dashboard)', () => {
    expect(() => addActivity({ days: {} }, 'dashboard')).toThrow();
  });

  it('menghitung hari berturut-turut', () => {
    const days = { '2026-11-08': {}, '2026-11-09': {}, '2026-11-10': {} };
    expect(computeStreak(days, '2026-11-10')).toBe(3);
    expect(computeStreak(days, '2026-11-11')).toBe(3); // hari ini belum belajar
    expect(computeStreak(days, '2026-11-12')).toBe(0);
  });

  it('dateKey memakai tanggal lokal', () => {
    expect(dateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('riwayat latihan', () => {
  it('menghitung nilai & soal yang salah', () => {
    const items = [
      { q: { type: 'ten_to_standard', n: 2 }, response: '100', correct: true, errorCode: null },
      { q: { type: 'ten_to_standard', n: 3 }, response: '100', correct: false, errorCode: 'E-PANGKAT' },
    ];
    const s = makeSession({ kind: 'latihan', title: 'M1 · Level 1', items });
    expect(s).toMatchObject({ score: 50, correct: 1, total: 2 });
    expect(wrongItems(s)).toHaveLength(1);
  });
});
