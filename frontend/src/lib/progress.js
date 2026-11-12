import { useSyncExternalStore } from 'react';

/**
 * Progres belajar disimpan di perangkat (localStorage) untuk versi Alpha (tanpa login).
 * Semua akses dibungkus try/catch: aplikasi tetap berjalan bila penyimpanan diblokir.
 * Sinkronisasi ke server menyusul (docs/ARCHITECTURE.md §5).
 */

const KEY = 'komaku.progress.v1';
const listeners = new Set();

const empty = () => ({ modules: {}, updatedAt: null });

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
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

export const moduleDefaults = () => ({
  lastItem: 0,
  maxItem: 0,
  levelUnlocked: 1,
  bestQuiz: null,
  completed: false,
  answered: 0,
  correct: 0,
  errors: {},
  paas: null,
});

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
