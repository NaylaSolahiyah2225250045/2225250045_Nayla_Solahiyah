import { useSyncExternalStore } from 'react';

/**
 * Pengaturan tampilan di perangkat (localStorage, dibungkus try/catch).
 * - animations: animasi dekoratif (maskot masuk/bergerak, bintang, transisi halaman).
 *   Bawaan: aktif, kecuali sistem meminta "kurangi gerakan" (prefers-reduced-motion).
 *   Saat nonaktif, maskot tetap tampil tetapi diam dan efek bintang tidak dijalankan.
 * - music: musik latar instrumental di SELURUH halaman (disetujui pengembang, 21 Nov 2026; sebelumnya hanya
 *   Sambutan). Bawaan: aktif. Browser baru mengizinkan suara setelah interaksi pertama (aturan autoplay).
 * - volume: volume musik 0–100 (bawaan 60).
 * - sfx: efek suara singkat (klik, menu, jawaban, level, kuis, lencana). Bawaan: aktif.
 *
 * Preferensi suara juga disimpan per akun (lib/account.js) agar berlaku lagi saat masuk kembali.
 *
 * @typedef {{ animations: boolean, music: boolean, sfx: boolean, volume: number }} Settings
 */

const KEY = 'nobaku.settings.v1';
export const DEFAULT_VOLUME = 60;
/** Volume 0–100 (bilangan bulat) atau null bila tidak sah. */
export const cleanVolume = (v) => (Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : null);
const listeners = new Set();

function systemPrefersReducedMotion() {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** @returns {Settings} */
export const defaultSettings = () => ({ animations: !systemPrefersReducedMotion(), music: true, sfx: true, volume: DEFAULT_VOLUME });

/** @returns {Settings} */
function load() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    const saved = raw ? JSON.parse(raw) : {};
    const out = defaultSettings();
    for (const k of ['animations', 'music', 'sfx']) if (typeof saved[k] === 'boolean') out[k] = saved[k];
    if (cleanVolume(saved.volume) !== null) out.volume = cleanVolume(saved.volume);
    return out;
  } catch {
    return defaultSettings();
  }
}

let state = load();

/** Tandai <html data-motion="on|off"> agar CSS bisa menyalakan/mematikan semua animasi dekoratif. */
function applyToDocument() {
  if (typeof document !== 'undefined') document.documentElement.dataset.motion = state.animations ? 'on' : 'off';
}
applyToDocument();

export function getSettings() {
  return state;
}

/** @param {Partial<Settings>} patch */
export function updateSettings(patch) {
  const next = { ...state, ...patch };
  next.volume = cleanVolume(next.volume) ?? DEFAULT_VOLUME;
  if (['animations', 'music', 'sfx', 'volume'].every((k) => next[k] === state[k])) return;
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* penyimpanan diblokir — pengaturan berlaku selama sesi ini saja */
  }
  applyToDocument();
  listeners.forEach((l) => l());
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Hook React: pengaturan terkini. */
export function useSettings() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
