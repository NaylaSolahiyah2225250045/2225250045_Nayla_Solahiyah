/**
 * Ringkasan belajar siswa yang disinkronkan untuk guru kelasnya (17 Nov 2026).
 *
 * Isinya HANYA data belajar yang sudah ada di perangkat: progres topik, riwayat latihan/kuis
 * (teks soal, jawaban, benar/salah, kode kesalahan), hari belajar, dan banyak halaman buku yang
 * dibaca. Tidak ada data pribadi tambahan. Bentuknya diperiksa server (SNAPSHOT_KEYS di backend).
 *
 * @typedef {{ prompt: string, response: string, correct: boolean, errorCode: string|null }} SnapItem
 * @typedef {{ id: string, at: string, kind: string, nodeId: string|null, moduleId: string|null, title: string,
 *   correct: number, total: number, score: number, items: SnapItem[] }} SnapSession
 * @typedef {{ v: 1, modules: Record<string, object>, history: SnapSession[], days: Record<string, object>,
 *   bookRead: number, updatedAt: string }} Snapshot
 */
import { getModuleProgress, moduleDefaults } from './progress.js';
import { getHistory } from './history.js';
import { getActivity } from './activity.js';
import { getBook, PROGRESS_IDS, summarizeLearner } from './learner.js';
import { promptText, responseText } from './sci/index.js';

export const SNAPSHOT_VERSION = 1;
const MAX_SESSIONS = 40;

/** Ringkas satu sesi riwayat (fungsi murni). */
export function compactSession(s) {
  return {
    id: s.id,
    at: s.at,
    kind: s.kind,
    nodeId: s.nodeId ?? null,
    moduleId: s.moduleId ?? null,
    title: s.title,
    correct: s.correct,
    total: s.total,
    score: s.score,
    items: (s.items ?? []).map((i) => ({
      prompt: String(i.q ? promptText(i.q) ?? '' : '').slice(0, 140),
      response: String(i.q ? responseText(i.q, i.response) : '').slice(0, 60),
      correct: !!i.correct,
      errorCode: i.errorCode ?? null,
    })),
  };
}

/** Hari belajar tanpa label rinci (hanya jumlah per jenis kegiatan). */
export function compactDays(days) {
  return Object.fromEntries(
    Object.entries(days).map(([k, d]) => [k, Object.fromEntries(Object.entries(d).map(([t, v]) => [t, { count: v.count ?? 0, correct: v.correct ?? 0 }]))]),
  );
}

/** Ringkasan dari data di perangkat ini. @returns {Snapshot} */
export function buildSnapshot(now = new Date()) {
  return {
    v: SNAPSHOT_VERSION,
    modules: Object.fromEntries(PROGRESS_IDS.map((id) => [id, getModuleProgress(id)])),
    history: getHistory().sessions.slice(0, MAX_SESSIONS).map(compactSession),
    days: compactDays(getActivity().days),
    bookRead: getBook().read.length,
    updatedAt: now.toISOString(),
  };
}

/**
 * Ringkasan untuk guru dari snapshot siswa (atau kosong bila siswa belum pernah sinkron).
 * Memakai rumus yang sama dengan Dashboard Siswa (summarizeLearner).
 * @param {Snapshot|null|undefined} snap
 */
export function summarizeSnapshot(snap) {
  const s = snap ?? {};
  const progressMap = Object.fromEntries(PROGRESS_IDS.map((id) => [id, { ...moduleDefaults(), ...(s.modules?.[id] ?? {}) }]));
  const sessions = Array.isArray(s.history) ? s.history : [];
  const days = s.days && typeof s.days === 'object' ? s.days : {};
  const sum = summarizeLearner({ progressMap, sessions, days, bookRead: Number(s.bookRead) || 0 });
  const lastDay = Object.keys(days).sort().at(-1) ?? null;
  const lastAt = sessions[0]?.at ?? null;
  return { ...sum, bookRead: Number(s.bookRead) || 0, lastDay, lastAt, hasData: !!snap };
}
