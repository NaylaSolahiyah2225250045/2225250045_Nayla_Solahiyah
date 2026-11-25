import { describe, expect, it } from 'vitest';
import { computeRewards, XP_PER_CORRECT, XP_PER_MODULE, XP_PER_LEVEL } from './rewards.js';

const mod = (o = {}) => ({ answered: 0, correct: 0, completed: false, bestQuiz: null, levelUnlocked: 1, ...o });

describe('XP & lencana', () => {
  it('belum belajar: 0 XP, level 1, tanpa lencana', () => {
    const r = computeRewards({});
    expect(r.xp).toBe(0);
    expect(r.level).toBe(1);
    expect(r.nextLevelAt).toBe(XP_PER_LEVEL);
    expect(r.badges.every((b) => !b.earned)).toBe(true);
  });

  it('XP = jawaban tepat + modul selesai', () => {
    const r = computeRewards({ t1: mod({ correct: 11, completed: true, bestQuiz: 80, levelUnlocked: 3 }), t2: mod({ correct: 2 }) });
    expect(r.xp).toBe(13 * XP_PER_CORRECT + XP_PER_MODULE);
    const earned = r.badges.filter((b) => b.earned).map((b) => b.id);
    expect(earned).toEqual(['langkah-pertama', 'kenal-pangkat']);
  });

  it('naik level setiap kelipatan XP_PER_LEVEL', () => {
    const r = computeRewards({ t1: mod({ correct: 25 }) });
    expect(r.xp).toBe(250);
    expect(r.level).toBe(2);
    expect(r.levelStart).toBe(250);
    expect(r.nextLevelAt).toBe(500);
  });

  it('lencana kuis sempurna & level mahir', () => {
    const r = computeRewards({ t3: mod({ correct: 30, completed: true, bestQuiz: 100, levelUnlocked: 4 }) });
    const earned = new Set(r.badges.filter((b) => b.earned).map((b) => b.id));
    for (const id of ['rajin-berlatih', 'pangkat-negatif', 'kuis-sempurna', 'level-mahir']) expect(earned.has(id)).toBe(true);
  });
});

describe('lencana dari aktivitas', () => {
  it('memakai statistik tambahan (hari aktif, ulang, Lab Koma, halaman buku) + kemajuan', () => {
    const r = computeRewards({}, { activeDays: 3, retries: 1, labMoves: 7, bookPages: 12 });
    const by = Object.fromEntries(r.badges.map((b) => [b.id, b]));
    expect(by['tiga-hari'].earned).toBe(true);
    expect(by['pantang-menyerah'].earned).toBe(true);
    expect(by['pembaca-buku'].earned).toBe(true);
    expect(by['penjelajah-koma']).toMatchObject({ earned: false, progress: 7, goal: 20 });
    expect(new Set(r.badges.map((b) => b.emblem)).size).toBe(r.badges.length);
  });
});
