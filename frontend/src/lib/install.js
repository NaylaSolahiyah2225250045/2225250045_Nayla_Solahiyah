import { useSyncExternalStore } from 'react';

/**
 * Menangkap event `beforeinstallprompt` (Chrome/Edge di Android, Windows, macOS, Linux)
 * agar tombol "Pasang aplikasi" bisa ditampilkan di halaman Pasang.
 * Safari (iOS/macOS) tidak memiliki event ini → tampilkan petunjuk manual.
 */
let deferred = null;
let installed = false;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    emit();
  });
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function detectPlatform() {
  const ua = navigator.userAgent || '';
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/i.test(ua) || iPadOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
  return 'other';
}

export async function promptInstall() {
  if (!deferred) return 'unavailable';
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  emit();
  return outcome;
}

const snapshot = () => ({ canPrompt: Boolean(deferred), installed: installed || isStandalone() });
let last = null;
function getSnapshot() {
  const s = snapshot();
  if (!last || last.canPrompt !== s.canPrompt || last.installed !== s.installed) last = s;
  return last;
}

export function useInstallState() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSnapshot,
    getSnapshot,
  );
}
