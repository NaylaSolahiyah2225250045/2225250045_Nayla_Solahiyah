import { describe, expect, it } from 'vitest';
import { migrateProgress } from './progress.js';
import { MIGRATE, MODULES } from '../content/modules.js';
import { toTopicNodeId } from './learner.js';

const mod = (o) => ({ lastItem: 0, maxItem: 0, levelUnlocked: 1, bestQuiz: null, completed: false, answered: 0, correct: 0, errors: {}, paas: null, ...o });

describe('pemindahan progres modul lama → lima topik', () => {
  const old = {
    modules: {
      m1: mod({ lastItem: 9, maxItem: 9, levelUnlocked: 4, bestQuiz: 80, completed: true, answered: 20, correct: 15, errors: { 'E-TANDA': 2 }, paas: 3 }),
      m2: mod({ levelUnlocked: 3, completed: true, bestQuiz: 100, answered: 10, correct: 8, errors: { 'E-KOMA': 1 } }),
      m3: mod({ maxItem: 5, lastItem: 5, levelUnlocked: 2, answered: 5, correct: 2, errors: { 'E-TANDA': 3 } }),
      m4: mod({ completed: true, bestQuiz: 60 }),
    },
    updatedAt: null,
  };
  const s = migrateProgress(old, MIGRATE);

  it('Topik 1 = Modul 1 (posisi layar ikut bergeser karena ada layar baru)', () => {
    expect(s.schema).toBe(2);
    expect(s.modules.t1).toMatchObject({ completed: true, bestQuiz: 80, answered: 20, correct: 15, levelUnlocked: 4, paas: 3 });
    expect(MODULES[0].items[s.modules.t1.lastItem].type).toBe('practice');
  });

  it('Topik 2 = Modul 2 + 3: jawaban & kesalahan dijumlah, selesai hanya bila keduanya selesai', () => {
    expect(s.modules.t2).toMatchObject({ answered: 15, correct: 10, levelUnlocked: 3, completed: false, bestQuiz: null });
    expect(s.modules.t2.errors).toEqual({ 'E-KOMA': 1, 'E-TANDA': 3 });
    expect(s.modules.t2.maxItem).toBe(MIGRATE.m3.map(5));
  });

  it('Topik 3 dari Modul 4 saja (Modul 5 belum dibuka): belum selesai', () => {
    expect(s.modules.t3.completed).toBe(false);
    expect(s.modules.t3.bestQuiz).toBe(null);
  });

  it('data lama tetap ada & tidak dipindah dua kali', () => {
    expect(s.modules.m1).toBeTruthy();
    expect(migrateProgress(s, MIGRATE)).toBe(s);
  });

  it('id titik riwayat lama → titik topik', () => {
    expect(toTopicNodeId('m3-l2')).toBe('t2-l2');
    expect(toTopicNodeId('m5-l4')).toBe('t3-l4');
    expect(toTopicNodeId('t4-l1')).toBe('t4-l1');
  });
});
