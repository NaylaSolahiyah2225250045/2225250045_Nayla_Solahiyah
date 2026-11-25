import { useEffect, useState } from 'react';
import { playSfx, unlockAudio } from '../lib/audio.js';
import { useLearner } from '../lib/learner.js';

/**
 * Pendengar suara global (dipasang sekali di App):
 *  - membuka audio pada interaksi pertama (syarat browser, terutama HP);
 *  - bunyi "klik" untuk tombol, bunyi "menu" untuk sidebar / navigasi bawah / panel Lainnya.
 * Fase *capture* dipakai agar bunyi klik terjadwal lebih dulu; bunyi hasil (benar/salah/level)
 * yang menyusul akan menggantikannya, jadi suara tidak bertumpuk.
 */
export function AudioListener() {
  useEffect(() => {
    const unlock = () => unlockAudio();
    const onClick = (e) => {
      const el = e.target.closest?.('button, a[href], [role="switch"], summary');
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      if (el.closest('.sidenav, .bottomnav, .sheet')) playSfx('menu');
      else playSfx('click');
    };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      document.removeEventListener('click', onClick, true);
    };
  }, []);
  return null;
}

const SEEN_KEY = 'nobaku.badges.seen.v1';
function readSeen() {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) ?? 'null');
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}
function writeSeen(ids) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* diblokir — hanya selama sesi */
  }
}

/**
 * Lencana baru → bunyi "lencana" (menunggu bunyi sebelumnya selesai) + pemberitahuan kecil.
 * Pertama kali dipasang: lencana yang sudah diraih dicatat diam-diam (tidak berbunyi beruntun).
 */
export function BadgeWatcher() {
  const { rewards } = useLearner();
  const earned = rewards.badges.filter((b) => b.earned);
  const key = earned.map((b) => b.id).join(',');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const ids = earned.map((b) => b.id);
    const seen = readSeen();
    if (seen === null) {
      writeSeen(ids);
      return undefined;
    }
    const fresh = earned.filter((b) => !seen.includes(b.id));
    if (!fresh.length) return undefined;
    writeSeen([...new Set([...seen, ...ids])]);
    playSfx('badge', { queue: true });
    setToast(fresh.map((b) => b.name).join(', '));
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return toast ? (
    <div className="toast toast--badge" role="status">
      🏅 Lencana baru: <b>{toast}</b>!
    </div>
  ) : null;
}
