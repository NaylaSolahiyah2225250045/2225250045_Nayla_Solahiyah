import { useSyncExternalStore } from 'react';
import { MIGRATE } from '../content/modules.js';

/**
 * Progres belajar disimpan di perangkat (localStorage) untuk versi Alpha (tanpa login).
 * Semua akses dibungkus try/catch: aplikasi tetap berjalan bila penyimpanan diblokir.
 * Sinkronisasi ke server menyusul (docs/ARCHITECTURE.md §5).
 */

const KEY = 'komaku.progress.v1';
const SCHEMA = 2; // 2 = lima topik (t1–t5); 1 = modul Alpha (m1–m5)
const listeners = new Set();

const empty = () => ({ modules: {}, updatedAt: null, schema: SCHEMA });

/**
 * Pindahkan progres modul lama (m1–m5) ke topik baru tanpa kehilangan data (fungsi murni).
 * Beberapa modul lama yang digabung jadi satu topik: jawaban & kesalahan dijumlah, level terbuka
 * diambil yang tertinggi, topik selesai bila semua modul asalnya selesai, posisi layar dipetakan.
 * Data modul lama dibiarkan (tidak dihapus).
 * @param {{modules: Record<string, object>, schema?: number}} s
 * @param {Record<string, {to: string, map: (i: number) => number}>} migrate
 */
export function migrateProgress(s, migrate) {
  if ((s.schema ?? 1) >= SCHEMA) return s;
  const groups = {};
  for (const [oldId, { to, map }] of Object.entries(migrate)) {
    const p = s.modules?.[oldId];
    if (p) (groups[to] ??= []).push({ p: { ...moduleDefaults(), ...p }, map });
  }
  const modules = { ...s.modules };
  for (const [to, list] of Object.entries(groups)) {
    if (modules[to]) continue;
    const errors = {};
    list.forEach(({ p }) => Object.entries(p.errors ?? {}).forEach(([k, v]) => (errors[k] = (errors[k] ?? 0) + v)));
    // Selesai hanya bila SEMUA modul asal topik ini selesai (modul yang belum pernah dibuka = belum selesai).
    const sourceCount = Object.values(migrate).filter((m) => m.to === to).length;
    const completed = list.length === sourceCount && list.every(({ p }) => p.completed);
    const visited = list.filter(({ p }) => p.maxItem > 0 || p.lastItem > 0);
    const last = visited.length ? visited.reduce((a, b) => (b.map(b.p.maxItem) > a.map(a.p.maxItem) ? b : a)) : null;
    modules[to] = {
      ...moduleDefaults(),
      lastItem: last ? last.map(last.p.lastItem) : 0,
      maxItem: last ? last.map(last.p.maxItem) : 0,
      levelUnlocked: Math.max(...list.map(({ p }) => p.levelUnlocked ?? 1)),
      bestQuiz: completed ? Math.min(...list.map(({ p }) => p.bestQuiz ?? 0)) : null,
      completed,
      answered: list.reduce((n, { p }) => n + p.answered, 0),
      correct: list.reduce((n, { p }) => n + p.correct, 0),
      errors,
      paas: list.map(({ p }) => p.paas).filter((v) => v !== null && v !== undefined).at(-1) ?? null,
    };
  }
  return { ...s, modules, schema: SCHEMA };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const s = { modules: {}, updatedAt: null, ...JSON.parse(raw) };
    const migrated = migrateProgress(s, MIGRATE);
    if (migrated !== s) localStorage.setItem(KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return empty();
  }
}

let state = load();

function save(next) {
  state = { ...next, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* penyimpanan tidak tersedia — progres hanya bertahan selama sesi */
  }
  listeners.forEach((l) => l());
}

// Deklarasi fungsi (bukan const) agar sudah tersedia saat load() berjalan di atas.
export function moduleDefaults() {
  return {
    lastItem: 0,
    maxItem: 0,
    levelUnlocked: 1,
    // Latihan topik (1 level × 10 soal, 23 Nov 2026) sudah lulus — penanda tetap, tidak bergantung pada Riwayat.
    practiceDone: false,
    bestQuiz: null,
    completed: false,
    answered: 0,
    correct: 0,
    errors: {},
    paas: null,
  };
}

export function getModuleProgress(id) {
  return { ...moduleDefaults(), ...(state.modules[id] ?? {}) };
}

function updateModule(id, fn) {
  const cur = getModuleProgress(id);
  save({ ...state, modules: { ...state.modules, [id]: fn(cur) } });
}

export const progress = {
  setPosition(id, index) {
    updateModule(id, (m) => ({ ...m, lastItem: index, maxItem: Math.max(m.maxItem, index) }));
  },
  recordAnswer(id, { correct, errorCode }) {
    updateModule(id, (m) => ({
      ...m,
      answered: m.answered + 1,
      correct: m.correct + (correct ? 1 : 0),
      errors: errorCode ? { ...m.errors, [errorCode]: (m.errors[errorCode] ?? 0) + 1 } : m.errors,
    }));
  },
  unlockLevel(id, level) {
    updateModule(id, (m) => ({ ...m, levelUnlocked: Math.min(4, Math.max(m.levelUnlocked, level)) }));
  },
  /** Latihan 10 soal topik ini lulus (≥ 60%). Juga membuka "level" berikutnya untuk kompatibilitas data lama. */
  markPracticeDone(id) {
    updateModule(id, (m) => ({ ...m, practiceDone: true, levelUnlocked: Math.min(4, Math.max(m.levelUnlocked, 2)) }));
  },
  finishQuiz(id, score) {
    updateModule(id, (m) => ({ ...m, bestQuiz: Math.max(m.bestQuiz ?? 0, score), completed: true }));
  },
  setPaas(id, value) {
    updateModule(id, (m) => ({ ...m, paas: value }));
  },
  reset() {
    save(empty());
  },
};

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Hook React: berlangganan perubahan progres. */
export function useProgress() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
