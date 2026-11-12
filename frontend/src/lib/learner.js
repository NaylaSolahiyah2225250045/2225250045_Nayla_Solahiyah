import { useSyncExternalStore } from 'react';
import { MODULES } from '../content/modules.js';
import { getModuleProgress, useProgress } from './progress.js';
import { activeDayCount, computeStreak, useActivity } from './activity.js';
import { useHistory } from './history.js';
import { computeRewards } from './rewards.js';
import { buildPath, nodeStatuses } from './path.js';

/* ---------- Posisi buku materi (halaman terakhir & halaman yang sudah dibaca) ---------- */
const BOOK_KEY = 'nobaku.book.v1';
const bookListeners = new Set();

function loadBook() {
  try {
    const s = JSON.parse(localStorage.getItem(BOOK_KEY) ?? 'null');
    return s && Array.isArray(s.read) ? s : { page: 0, read: [] };
  } catch {
    return { page: 0, read: [] };
  }
}

let book = loadBook();

/** Simpan halaman yang sedang dibuka & tandai halaman yang terlihat sebagai sudah dibaca. */
export function saveBookPage(page, visible = [page]) {
  const read = [...new Set([...book.read, ...visible])].sort((a, b) => a - b);
  book = { page, read };
  try {
    localStorage.setItem(BOOK_KEY, JSON.stringify(book));
  } catch {
    /* diblokir — hanya selama sesi */
  }
  bookListeners.forEach((l) => l());
}

export function useBook() {
  return useSyncExternalStore(
    (l) => {
      bookListeners.add(l);
      return () => bookListeners.delete(l);
    },
    () => book,
    () => book,
  );
}

/* ---------- Ringkasan siswa (dipakai Beranda, Latihan, Profil) ---------- */
export const PATH = buildPath(MODULES);
export const AVAILABLE_MODULES = MODULES.filter((m) => !m.comingSoon);

/**
 * Hook ringkasan belajar: progres modul, XP & lencana, status jalur latihan, statistik aktivitas.
 */
export function useLearner() {
  useProgress();
  const activity = useActivity();
  const history = useHistory();
  const bk = useBook();

  const progressMap = Object.fromEntries(AVAILABLE_MODULES.map((m) => [m.id, getModuleProgress(m.id)]));
  const days = activity.days;
  const sum = (type) => Object.values(days).reduce((s, d) => s + (d[type]?.count ?? 0), 0);
  const stats = {
    activeDays: activeDayCount(activity),
    retries: history.sessions.filter((s) => s.kind === 'ulang').length,
    labMoves: sum('lab'),
    bookPages: bk.read.length,
  };
  const passed = new Set(history.sessions.filter((s) => s.nodeId && s.correct >= 3).map((s) => s.nodeId));
  const statuses = nodeStatuses(PATH, (id) => progressMap[id], passed);
  const answered = Object.values(progressMap).reduce((s, p) => s + p.answered, 0);
  const correct = Object.values(progressMap).reduce((s, p) => s + p.correct, 0);

  return {
    progressMap,
    rewards: computeRewards(progressMap, stats),
    stats,
    streak: computeStreak(days),
    days,
    history,
    book: bk,
    path: PATH,
    statuses,
    nodesDone: PATH.filter((n) => statuses[n.id] === 'done').length,
    currentNode: PATH.find((n) => statuses[n.id] === 'current') ?? null,
    answered,
    correct,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
  };
}
