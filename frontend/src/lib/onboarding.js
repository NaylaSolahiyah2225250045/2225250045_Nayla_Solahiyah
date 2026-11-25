import { useSyncExternalStore } from 'react';

/**
 * Panduan awal: kapan ditampilkan.
 *  - Otomatis: akun yang sedang masuk masih `tourPending` (lib/account.js, disimpan per akun).
 *  - Manual  : siswa membukanya lagi dari Profil → Pengaturan (hanya di memori, tidak disimpan).
 */
let manualOpen = false;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export function openTour() {
  manualOpen = true;
  emit();
}

export function closeTour() {
  manualOpen = false;
  emit();
}

/** Panduan tampil? @param {{tourPending?: boolean} | null} session */
export const shouldShowTour = (session, manual) => !!session && (session.tourPending === true || manual);

/** Hook: true bila panduan dibuka manual. */
export function useManualTour() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => manualOpen,
    () => manualOpen,
  );
}
