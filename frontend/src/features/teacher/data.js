import { useCallback, useEffect, useState } from 'react';
import { classroom } from '../../lib/classroom.js';
import { summarizeSnapshot } from '../../lib/snapshot.js';
import { AVAILABLE_MODULES, PATH } from '../../lib/learner.js';
import { FINAL_ID } from '../../lib/path.js';

/**
 * Data Dashboard Guru: semua kelas milik guru + siswanya + ringkasan belajar tiap siswa.
 * Ringkasan dihitung dengan rumus yang sama dengan Dashboard Siswa (lib/snapshot.js).
 */
export function enrich(overview) {
  return (overview?.classes ?? []).map(({ klass, students }) => ({
    klass,
    students: students.map((s) => ({ ...s, className: klass.name, classId: klass.id, sum: summarizeSnapshot(s.snapshot) })),
  }));
}

export function useTeacherData() {
  const [state, setState] = useState({ loading: true, error: '', classes: [] });
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    return classroom()
      .overview()
      .then((o) => setState({ loading: false, error: '', classes: enrich(o) }))
      .catch((e) => setState({ loading: false, error: e.message, classes: [] }));
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  const students = state.classes.flatMap((c) => c.students);
  return { ...state, students, reload };
}

/** Topik selesai (kuis topik dikerjakan) & level latihan selesai per topik untuk satu siswa. */
export function topicProgress(sum) {
  return AVAILABLE_MODULES.map((m) => {
    const nodes = PATH.filter((n) => n.moduleId === m.id);
    const done = nodes.filter((n) => sum.statuses[n.id] === 'done').length;
    const p = sum.progressMap[m.id];
    return { module: m, levelsDone: done, levels: nodes.length, completed: !!p?.completed, bestQuiz: p?.bestQuiz ?? null };
  });
}

export const finalScore = (sum) => sum.progressMap[FINAL_ID]?.bestQuiz ?? null;

/** Rata-rata bilangan bulat (dibulatkan), null bila kosong. */
export function avg(list) {
  const xs = list.filter((x) => typeof x === 'number');
  return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
}

/** "3 hari lalu", "hari ini", … dari tanggal ISO atau kunci YYYY-MM-DD. */
export function ago(dateLike, now = new Date()) {
  if (!dateLike) return 'belum ada';
  const d = new Date(dateLike.length === 10 ? `${dateLike}T12:00:00` : dateLike);
  const days = Math.floor((new Date(now.toDateString()) - new Date(d.toDateString())) / 86400000);
  if (days <= 0) return 'hari ini';
  if (days === 1) return 'kemarin';
  if (days < 30) return `${days} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Terakhir aktif: tanggal belajar terbaru atau sesi terbaru. */
export const lastActive = (sum) => [sum.lastAt, sum.lastDay].filter(Boolean).sort().at(-1) ?? null;

/** Aktif dalam N hari terakhir. */
export function activeWithin(sum, days, now = new Date()) {
  const last = lastActive(sum);
  if (!last) return false;
  const d = new Date(last.length === 10 ? `${last}T12:00:00` : last);
  return now - d <= days * 86400000;
}

export const KIND_LABEL = { latihan: 'Latihan', kuis: 'Kuis', ulang: 'Ulang soal' };
