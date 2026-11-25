import { useEffect, useRef } from 'react';
import { useProgress } from '../lib/progress.js';
import { useHistory } from '../lib/history.js';
import { useActivity } from '../lib/activity.js';
import { useBook } from '../lib/learner.js';
import { useSession } from '../lib/account.js';
import { classroom } from '../lib/classroom.js';
import { buildSnapshot } from '../lib/snapshot.js';

const DELAY_MS = 2500;

/**
 * Siswa: kirim ringkasan belajar terbaru (lib/snapshot.js) agar guru kelasnya bisa memantau.
 * Dikirim beberapa detik setelah ada perubahan progres/riwayat/aktivitas/buku, dan saat kembali online.
 * Gagal (offline/server mati) diabaikan — dicoba lagi pada perubahan berikutnya. Tidak menampilkan apa pun.
 */
export default function ClassSync() {
  const session = useSession();
  const progress = useProgress();
  const history = useHistory();
  const activity = useActivity();
  const book = useBook();
  const timer = useRef(null);
  const isStudent = session && session.role !== 'teacher';

  useEffect(() => {
    if (!isStudent) return undefined;
    const push = () => {
      classroom()
        .pushSnapshot(buildSnapshot())
        .catch(() => {});
    };
    clearTimeout(timer.current);
    timer.current = setTimeout(push, DELAY_MS);
    window.addEventListener('online', push);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener('online', push);
    };
  }, [isStudent, session?.username, progress, history, activity, book]);

  return null;
}
