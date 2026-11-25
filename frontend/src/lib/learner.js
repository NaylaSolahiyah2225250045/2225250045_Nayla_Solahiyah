import { useSyncExternalStore } from 'react';
import { MIGRATE, MODULES } from '../content/modules.js';
import { getModuleProgress, useProgress } from './progress.js';
import { computeStreak, useActivity } from './activity.js';
import { useHistory } from './history.js';
import { computeRewards } from './rewards.js';
import { buildPath, FINAL_ID, nodeStatuses } from './path.js';
import { isPassed } from '../content/bank.js';

/* ---------- Posisi buku materi (halaman terakhir & halaman yang sudah dibaca) ---------- */
const BOOK_KEY = 'nobaku.book.v1';
/** Versi susunan buku. Saat halaman buku disusun ulang, posisi lama dikembalikan ke sampul
 * (jumlah halaman yang sudah dibaca tetap dihitung). */
const BOOK_LAYOUT = 2;
const bookListeners = new Set();

function loadBook() {
  try {
    const s = JSON.parse(localStorage.getItem(BOOK_KEY) ?? 'null');
    if (!s || !Array.isArray(s.read)) return { page: 0, read: [], v: BOOK_LAYOUT };
    return s.v === BOOK_LAYOUT ? s : { ...s, page: 0, v: BOOK_LAYOUT };
  } catch {
    return { page: 0, read: [] };
  }
}

let book = loadBook();
/** Posisi buku saat ini (untuk ringkasan yang disinkronkan). */
export const getBook = () => book;

/** Simpan halaman yang sedang dibuka & tandai halaman yang terlihat sebagai sudah dibaca. */
export function saveBookPage(page, visible = [page]) {
  const read = [...new Set([...book.read, ...visible])].sort((a, b) => a - b);
  book = { page, read, v: BOOK_LAYOUT };
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
/** Id titik riwayat lama ("m2-l3") → id titik topik baru ("t2-l3"). */
export function toTopicNodeId(id) {
  const m = /^(m\d+)-(l\d)$/.exec(id ?? '');
  return m && MIGRATE[m[1]] ? `${MIGRATE[m[1]].to}-${m[2]}` : id;
}

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
  const progressMap = Object.fromEntries(PROGRESS_IDS.map((id) => [id, getModuleProgress(id)]));
  return { ...summarizeLearner({ progressMap, sessions: history.sessions, days: activity.days, bookRead: bk.read.length }), history, book: bk };
}

/** Id progres yang diringkas: topik yang tersedia + Kuis Akhir. */
export const PROGRESS_IDS = [...AVAILABLE_MODULES.map((m) => m.id), FINAL_ID];

/**
 * Ringkasan belajar (fungsi murni) — dipakai Dashboard Siswa (useLearner) dan Dashboard Guru
 * (dari ringkasan yang disinkronkan siswa), sehingga angka yang dilihat guru sama dengan siswa.
 * @param {{ progressMap: Record<string, object>, sessions: object[], days: Record<string, object>, bookRead: number }} d
 */
export function summarizeLearner({ progressMap, sessions, days, bookRead }) {
  const sum = (type) => Object.values(days).reduce((s, d) => s + (d[type]?.count ?? 0), 0);
  const stats = {
    activeDays: Object.keys(days).length,
    retries: sessions.filter((s) => s.kind === 'ulang').length,
    labMoves: sum('lab'),
    bookPages: bookRead,
  };
  const history = { sessions };
  // Lulus = ≥ 60% dari banyak soal sesi itu (sesi lama 5 soal → 3, latihan baru 10 soal → 6).
  const passed = new Set(history.sessions.filter((s) => s.nodeId && isPassed(s.correct, s.total)).map((s) => toTopicNodeId(s.nodeId)));
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
    path: PATH,
    statuses,
    nodesDone: PATH.filter((n) => statuses[n.id] === 'done').length,
    currentNode: PATH.find((n) => statuses[n.id] === 'current') ?? null,
    answered,
    correct,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
  };
}
