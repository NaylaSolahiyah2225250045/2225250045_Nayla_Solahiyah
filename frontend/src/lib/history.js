import { useSyncExternalStore } from 'react';

/**
 * Riwayat Latihan: setiap sesi latihan/kuis/ulang beserta soal, jawaban siswa, benar/salah.
 * Jawaban benar & penjelasan dihitung ulang dari soal oleh lib/sci saat ditampilkan (tidak disimpan ganda).
 * Disimpan di perangkat (localStorage, dibungkus try/catch); maksimal MAX_SESSIONS sesi terbaru.
 *
 * @typedef {{ q: object, response: any, correct: boolean, errorCode: string|null }} HistoryItem
 * @typedef {{ id: string, at: string, kind: 'latihan'|'kuis'|'ulang', nodeId: string|null, moduleId: string|null,
 *   title: string, items: HistoryItem[], score: number, correct: number, total: number }} HistorySession
 */

const KEY = 'nobaku.history.v1';
export const MAX_SESSIONS = 60;

/**
 * Bentuk sesi baru (fungsi murni).
 * @param {{kind: HistorySession['kind'], nodeId?: string|null, moduleId?: string|null, title: string, items: HistoryItem[]}} s
 * @param {Date} [now]
 * @returns {HistorySession}
 */
export function makeSession({ kind, nodeId = null, moduleId = null, title, items }, now = new Date()) {
  const correct = items.filter((i) => i.correct).length;
  return {
    id: `${now.getTime().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    at: now.toISOString(),
    kind,
    nodeId,
    moduleId,
    title,
    items,
    correct,
    total: items.length,
    score: items.length ? Math.round((correct / items.length) * 100) : 0,
  };
}

/** Soal yang dijawab salah dalam satu sesi. @param {HistorySession} s */
export const wrongItems = (s) => s.items.filter((i) => !i.correct);

/* ---------- penyimpanan ---------- */
const listeners = new Set();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return Array.isArray(s?.sessions) ? s : { sessions: [] };
  } catch {
    return { sessions: [] };
  }
}

let state = load();

function save(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* penyimpanan diblokir — riwayat hanya bertahan selama sesi */
  }
  listeners.forEach((l) => l());
}

/** Simpan sesi (terbaru di depan). @returns {HistorySession} */
export function recordSession(data) {
  const s = makeSession(data);
  save({ sessions: [s, ...state.sessions].slice(0, MAX_SESSIONS) });
  return s;
}

export function getHistory() {
  return state;
}

export const findSession = (id) => state.sessions.find((s) => s.id === id) ?? null;

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Hook React: riwayat terkini. */
export function useHistory() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
