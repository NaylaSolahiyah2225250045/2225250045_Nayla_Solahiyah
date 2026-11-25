import { useEffect, useState } from 'react';
import { applyMusicVolume, isAudioUnlocked, startMusic, stopMusic, tryAutoplay, unlockAudio } from '../lib/audio.js';
import { getSettings, useSettings } from '../lib/settings.js';

/**
 * Musik latar global (disetujui pengembang, 21 Nov 2026). Dipasang SEKALI di App (di luar rute),
 * jadi musik terus berjalan saat berpindah halaman dan tidak mengulang dari awal.
 *  - Mencoba langsung berbunyi saat dibuka (bila browser mengizinkan autoplay); bila tidak,
 *    mulai pada sentuhan/klik/tombol pertama — melodi langsung terdengar, tanpa intro hening.
 *  - Mengikuti Musik ON/OFF & volume (lib/settings.js; disimpan per akun lewat AudioPrefsSync).
 *  - Memudar saat tab/aplikasi disembunyikan, lanjut lagi saat kembali.
 */
export default function GlobalMusic() {
  const { music, volume } = useSettings();
  const [ready, setReady] = useState(() => isAudioUnlocked());

  // Buka audio: coba autoplay dulu, lalu tunggu interaksi pertama.
  useEffect(() => {
    if (ready) return undefined;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    tryAutoplay().then((ok) => ok && go());
    const on = () => {
      unlockAudio();
      go();
    };
    const opts = { capture: true };
    document.addEventListener('pointerdown', on, opts);
    document.addEventListener('keydown', on, opts);
    document.addEventListener('touchstart', on, opts);
    return () => {
      document.removeEventListener('pointerdown', on, opts);
      document.removeEventListener('keydown', on, opts);
      document.removeEventListener('touchstart', on, opts);
    };
  }, [ready]);

  useEffect(() => {
    if (ready && music && !document.hidden) startMusic();
    else stopMusic(0.5);
  }, [ready, music]);

  useEffect(() => {
    applyMusicVolume();
  }, [volume]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) stopMusic(0.3);
      else if (isAudioUnlocked() && getSettings().music) startMusic();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return null;
}
