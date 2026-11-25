import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BANK, FINAL_QUIZ, PASS_COUNT, PER_SESSION } from './bank.js';
import { ERROR_MESSAGES, errorLabel } from './messages.js';
import { ERROR_PHASES, FINAL_GOAL, LEVEL_GOALS, PHASES, QUIZ_GOAL, SKILLS, TOPIC_RULES } from './rmt.js';
import { goalFor, mediationFor, phaseLabel, phasesOf, skillOf, topicMediation, topicOf } from '../lib/rmt.js';
import { compareValues, firstNonZeroPosition, normalizeKey, operationValue, toScientific, toStandard, valueOf } from '../lib/sci/index.js';

const words = (s) => s.trim().split(/\s+/).length;
const TOPICS = Object.keys(BANK);
const allQuestions = () => [
  ...TOPICS.flatMap((t) => [...Object.values(BANK[t].levels).flat().map((q) => [t, q]), ...BANK[t].quiz.map((q) => [t, q])]),
  ...FINAL_QUIZ.map((q) => [null, q]),
];

describe('RMT: bank soal tidak berubah', () => {
  it('sidik isi BANK, FINAL_QUIZ, PASS_COUNT, PER_SESSION sama dengan versi yang disetujui (23 Nov 2026)', () => {
    // Bila tes ini gagal, berarti soal/kunci/pembahasan/petunjuk/jumlah/urutan soal berubah —
    // perubahan bank WAJIB disetujui pengembang dulu (CLAUDE.md, docs/RMT.md).
    // Riwayat: 21 Nov 2026 (Level 1–4) → 23 Nov 2026 (1 level × 10 soal per topik, disetujui pengembang) → 23 Nov 2026 (soal disesuaikan dengan kompetensi tiap topik, tanpa tumpang tindih antar-topik, diminta pengembang).
    const hash = createHash('sha256').update(JSON.stringify({ BANK, FINAL_QUIZ, PASS_COUNT, PER_SESSION })).digest('hex');
    expect(hash).toBe('cd541b7c24bf03b9e8f958a15b939d316ba9bb8c537a44890843738baee8a0f8');
  });

  it('fungsi RMT tidak mengubah objek soal', () => {
    for (const [t, q] of allQuestions()) {
      const before = JSON.stringify(q);
      skillOf(q);
      topicOf(q, t);
      mediationFor(q, t);
      expect(JSON.stringify(q)).toBe(before);
    }
  });
});

describe('RMT: Intensionalitas & Pemberian Makna (tujuan level)', () => {
  it('setiap topik Level 1–4, kuis topik, dan Kuis Akhir punya tujuan & alasan penting', () => {
    for (const t of TOPICS) {
      for (const level of Object.keys(BANK[t].levels).map(Number)) {
        const g = goalFor({ kind: 'level', topicId: t, level });
        expect(g, `${t} L${level}`).toBeTruthy();
      }
      expect(goalFor({ kind: 'quiz', topicId: t })).toBe(QUIZ_GOAL);
    }
    expect(goalFor({ kind: 'final' })).toBe(FINAL_GOAL);
    expect(goalFor({ kind: 'level', topicId: 'tx', level: 1 })).toBeNull();
  });

  it('tujuan & alasan singkat (≤ 20 kata) dan diakhiri titik', () => {
    const all = [...Object.values(LEVEL_GOALS).flatMap((t) => Object.values(t)), QUIZ_GOAL, FINAL_GOAL];
    for (const g of all) {
      for (const s of [g.goal, g.why]) {
        expect(words(s), s).toBeLessThanOrEqual(20);
        expect(s.endsWith('.'), s).toBe(true);
      }
    }
  });
});

describe('RMT: pertanyaan pemandu & aturan umum (mediated questioning, Transendensi)', () => {
  it('setiap soal di bank & Kuis Akhir mendapat pertanyaan pemandu dan aturan umum', () => {
    for (const [t, q] of allQuestions()) {
      const m = mediationFor(q, t);
      expect(m, JSON.stringify(q).slice(0, 80)).toBeTruthy();
      expect(m.guide.endsWith('?')).toBe(true);
      expect(m.rule.endsWith('.')).toBe(true);
    }
  });

  it('soal Kuis Akhir & soal yang dibuka dari Riwayat (tanpa konteks halaman) tetap menemukan topiknya', () => {
    for (const q of FINAL_QUIZ) expect(mediationFor(structuredClone(q))).toBeTruthy();
    for (const [t, q] of allQuestions()) if (q.form) expect(topicOf(structuredClone(q)), q.form).toBe(t ?? `t${q.topic}`);
  });

  it('batas kata: pertanyaan pemandu ≤ 16 kata, aturan umum ≤ 28 kata', () => {
    for (const m of [...Object.values(SKILLS), ...Object.values(TOPIC_RULES)]) {
      expect(words(m.guide), m.guide).toBeLessThanOrEqual(16);
      expect(words(m.rule), m.rule).toBeLessThanOrEqual(28);
    }
  });

  it('aturan umum bersifat umum: tidak memuat angka soal (hanya 1 dan 10)', () => {
    for (const m of [...Object.values(SKILLS), ...Object.values(TOPIC_RULES)]) {
      for (const d of m.rule.match(/\d+/g) ?? []) expect(['1', '10'], m.rule).toContain(d);
    }
  });

  it('keterampilan ditentukan dari jenis soal', () => {
    expect(skillOf({ type: 'to_scientific', value: '45.000' })).toBe('keBaku');
    expect(skillOf({ type: 'to_scientific', focus: 'zero', value: '0,0405' })).toBe('nolTengah');
    expect(skillOf({ type: 'to_standard', focus: 'back', a: '3', n: 2 })).toBe('keBiasa');
    expect(skillOf({ type: 'operation', op: 'bagi', x: {}, y: {} })).toBe('bagi');
    expect(skillOf({ type: 'operation', op: 'kali', text: 'Cerita', x: {}, y: {} })).toBe('cerita');
    expect(skillOf({ type: 'choose_correct', focus: 'compare' })).toBe('banding');
    expect(skillOf({ type: 'choose_correct', form: 'x' })).toBeNull();
    expect(topicMediation('t4')).toBe(TOPIC_RULES.t4);
    expect(topicMediation('m1')).toBeNull();
  });
});

describe('RMT: kebenaran matematis aturan umum (dihitung lib/sci)', () => {
  const sci = (a, n) => valueOf({ a, n });

  it('pangkat10: 10ⁿ = 1 diikuti n nol; 10⁻ⁿ = angka 1 di posisi ke-n setelah koma', () => {
    for (let n = 1; n <= 9; n++) {
      expect(toStandard(sci('1', n)).replace(/\./g, '')).toBe('1' + '0'.repeat(n));
      expect(firstNonZeroPosition(toStandard(sci('1', -n)))).toBe(n);
    }
  });

  it('keBaku: bilangan ≥ 10 berpangkat positif, < 1 berpangkat negatif, 1 ≤ a < 10', () => {
    for (const v of ['45000', '10', '0,0072', '0,5', '7', '3060000']) {
      const x = sci(v, 0);
      const { a, n } = toScientific(x);
      if (compareValues(x, sci('10', 0)) >= 0) expect(n, v).toBeGreaterThan(0);
      if (compareValues(x, sci('1', 0)) < 0) expect(n, v).toBeLessThan(0);
      // 1 ≤ a < 10: tepat satu angka (bukan nol) sebelum koma — dicek dari string, tanpa floating point.
      expect(a, v).toMatch(/^[1-9](,\d+)?$/);
    }
  });

  it('keBiasa: pangkat n → koma bergeser n tempat; tempat kosong diisi nol', () => {
    expect(toStandard(sci('3,07', 5))).toBe('307.000');
    expect(toStandard(sci('3,07', -5))).toBe('0,0000307');
  });

  it('normal: koma pada a bergeser k ke kiri → pangkat bertambah k (nilai tetap)', () => {
    expect(normalizeKey('36', 6)).toEqual({ a: '3,6', n: 7 });
    expect(normalizeKey('0,45', 3)).toEqual({ a: '4,5', n: 2 });
  });

  it('kali/bagi: (a × 10ᵐ)(b × 10ⁿ) = ab × 10ᵐ⁺ⁿ dan (a × 10ᵐ):(b × 10ⁿ) = (a:b) × 10ᵐ⁻ⁿ', () => {
    const kali = operationValue({ op: 'kali', x: { a: '4', n: 3 }, y: { a: '2', n: 5 } });
    expect(toScientific(kali)).toEqual({ a: '8', n: 8 });
    const bagi = operationValue({ op: 'bagi', x: { a: '6', n: 4 }, y: { a: '2', n: 1 } });
    expect(toScientific(bagi)).toEqual({ a: '3', n: 3 });
  });

  it('banding: pangkat lebih besar → bilangan lebih besar; pangkat sama → bandingkan a', () => {
    expect(compareValues(sci('1,2', -5), sci('9,9', -6))).toBe(1);
    expect(compareValues(sci('9,9', 2), sci('1,1', 3))).toBe(-1);
    expect(compareValues(sci('3,4', 4), sci('3,2', 4))).toBe(1);
  });
});

describe('RMT: umpan balik & pemetaan fase fungsi kognitif', () => {
  it('setiap kode kesalahan punya pertanyaan balik yang singkat dan bertanya', () => {
    for (const [code, m] of Object.entries(ERROR_MESSAGES)) {
      expect(m.ask, code).toBeTruthy();
      expect(m.ask.includes('?'), code).toBe(true);
      expect(words(m.ask), m.ask).toBeLessThanOrEqual(16);
    }
  });

  it('setiap kode kesalahan dipetakan ke fase yang dikenal (boleh lebih dari satu, boleh kosong bila belum cukup bukti)', () => {
    expect(new Set(Object.keys(ERROR_PHASES))).toEqual(new Set(Object.keys(ERROR_MESSAGES)));
    expect(new Set(Object.keys(errorLabel))).toEqual(new Set(Object.keys(ERROR_MESSAGES)));
    for (const [code, e] of Object.entries(ERROR_PHASES)) {
      expect(e.evidence, code).toBeTruthy();
      for (const p of e.phases) expect(Object.keys(PHASES)).toContain(p);
      expect(new Set(e.phases).size).toBe(e.phases.length);
    }
    expect(phasesOf('E-LAIN')).toEqual([]);
    expect(phaseLabel('E-LAIN')).toBe('');
    expect(phaseLabel('E-NORMAL')).toBe('Output');
    expect(phaseLabel('E-KOMA')).toBe('Output/Elaborasi');
    expect(phaseLabel('kode-tak-dikenal')).toBe('');
  });
});
