import { useSyncExternalStore } from 'react';

/**
 * Log aktivitas belajar per tanggal (untuk Kalender Belajar & lencana).
 * HANYA kegiatan belajar sungguhan yang dicatat: membaca halaman materi, menjawab soal,
 * mengulang soal, bereksperimen di Lab Koma. Masuk aplikasi / membuka Dashboard TIDAK dicatat.
 * Disimpan di perangkat (localStorage, dibungkus try/catch).
 *
 * @typedef {'materi'|'modul'|'latihan'|'kuis'|'ulang'|'lab'} ActivityType
 * @typedef {{ count: number, correct?: number, labels: string[] }} ActivityEntry
 * @typedef {Partial<Record<ActivityType, ActivityEntry>>} DayLog
 * @typedef {{ days: Record<string, DayLog> }} ActivityState
 */

const KEY = 'nobaku.activity.v1';
const MAX_LABELS = 6;

export const ACTIVITY_TYPES = {
  materi: { label: 'Membaca buku materi', unit: 'halaman' },
  modul: { label: 'Belajar di modul interaktif', unit: 'layar' },
  latihan: { label: 'Mengerjakan latihan', unit: 'soal' },
  kuis: { label: 'Mengerjakan kuis', unit: 'soal' },
  ulang: { label: 'Mengulang soal yang salah', unit: 'soal' },
  lab: { label: 'Bereksperimen di Lab Koma', unit: 'geseran' },
};

/** Kunci tanggal lokal "YYYY-MM-DD". @param {Date} [d] */
export function dateKey(d = new Date()) {
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Tambah aktivitas (fungsi murni).
 * @param {ActivityState} state @param {ActivityType} type
 * @param {{count?: number, correct?: number, label?: string}} opts @param {string} key
 * @returns {ActivityState}
 */
export function addActivity(state, type, { count = 1, correct = 0, label } = {}, key = dateKey()) {
  if (!ACTIVITY_TYPES[type]) throw new Error(`Jenis aktivitas tidak dikenal: ${type}`);
  const day = state.days[key] ?? {};
  const cur = day[type] ?? { count: 0, correct: 0, labels: [] };
  const labels = label && !cur.labels.includes(label) ? [...cur.labels, label].slice(-MAX_LABELS) : cur.labels;
  return {
    ...state,
    days: { ...state.days, [key]: { ...day, [type]: { count: cur.count + count, correct: (cur.correct ?? 0) + correct, labels } } },
  };
}

/** Hari beraktivitas berturut-turut sampai `todayKey` (hari ini boleh belum, dihitung dari kemarin). */
export function computeStreak(days, todayKey = dateKey()) {
  const d = new Date(`${todayKey}T12:00:00`);
  if (!days[todayKey]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[dateKey(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/* ---------- penyimpanan ---------- */
const listeners = new Set();
const empty = () => ({ days: {} });

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : null;
    return s && typeof s.days === 'object' ? s : empty();
  } catch {
    return empty();
  }
}

let state = load();

function save(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* penyimpanan diblokir — log hanya bertahan selama sesi */
  }
  listeners.forEach((l) => l());
}

/** Catat aktivitas belajar hari ini. */
export function logActivity(type, opts) {
  save(addActivity(state, type, opts));
}

export function getActivity() {
  return state;
}

/** Jumlah hari yang punya aktivitas belajar. */
export const activeDayCount = (s = state) => Object.keys(s.days).length;

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Hook React: log aktivitas terkini. */
export function useActivity() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
