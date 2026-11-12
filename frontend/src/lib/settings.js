import { useSyncExternalStore } from 'react';

/**
 * Pengaturan tampilan di perangkat (localStorage, dibungkus try/catch).
 * - animations: animasi dekoratif (maskot masuk/bergerak, bintang, transisi halaman).
 *   Bawaan: aktif, kecuali sistem meminta "kurangi gerakan" (prefers-reduced-motion).
 *   Saat nonaktif, maskot tetap tampil tetapi diam dan efek bintang tidak dijalankan.
 *
 * @typedef {{ animations: boolean }} Settings
 */

const KEY = 'nobaku.settings.v1';
const listeners = new Set();

function systemPrefersReducedMotion() {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** @returns {Settings} */
export const defaultSettings = () => ({ animations: !systemPrefersReducedMotion() });

/** @returns {Settings} */
function load() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    const saved = raw ? JSON.parse(raw) : {};
    return { ...defaultSettings(), ...(typeof saved.animations === 'boolean' ? { animations: saved.animations } : {}) };
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
  state = { ...state, ...patch };
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
