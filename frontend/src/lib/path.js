/**
 * Jalur Latihan (disusun ulang 23 Nov 2026): untuk setiap topik ada SATU titik latihan berisi 10 soal
 * (mudah → sedang → sulit), lalu di ujung jalur satu titik Level 5 · Kuis Akhir yang mencakup kelima topik.
 * Sebelumnya setiap topik punya Level 1–4 (id titik `t1-l1` … `t1-l4`); riwayat lama tetap terbaca.
 * Status titik dihitung dari progres & riwayat yang sudah ada.
 *
 * @typedef {{ id: string, moduleId: string, moduleNo: number|null, moduleTitle: string,
 *   kind: 'level'|'final', level: number, title: string, subtitle: string }} PathNode
 * @typedef {'done'|'current'|'locked'} NodeStatus
 */

export const LEVEL_NAMES = { 1: 'Latihan', 5: 'Kuis Akhir' };

/** Id "modul" untuk progres Kuis Akhir (disimpan di progres seperti modul lain). */
export const FINAL_ID = 'final';
export const FINAL_NODE_ID = 'kuis-akhir';

/** Id titik latihan sebuah topik, mis. "t2-latihan". */
export const practiceNodeId = (moduleId) => `${moduleId}-latihan`;

/** Id titik lama "t2-l3" (Level 1–4, sebelum 23 Nov 2026) → titik latihan topiknya; id lain tidak berubah. */
export function toPracticeNodeId(id) {
  const m = /^(t\d+)-l[1-4]$/.exec(id ?? '');
  return m ? practiceNodeId(m[1]) : id;
}

/** @param {{id:string, no:number, title:string, comingSoon?:boolean}[]} modules @returns {PathNode[]} */
export function buildPath(modules) {
  const levels = modules
    .filter((m) => !m.comingSoon)
    .map((m) => ({
      id: practiceNodeId(m.id),
      moduleId: m.id,
      moduleNo: m.no,
      moduleTitle: m.title,
      kind: 'level',
      level: 1,
      title: 'Latihan',
      subtitle: '10 soal',
    }));
  return [
    ...levels,
    { id: FINAL_NODE_ID, moduleId: FINAL_ID, moduleNo: null, moduleTitle: 'Kuis Akhir', kind: 'final', level: 5, title: 'Level 5', subtitle: 'Kuis Akhir' },
  ];
}

/** Label singkat titik, mis. "Topik 2 · Latihan 10 soal" atau "Level 5 · Kuis Akhir". */
export const nodeLabel = (n) => (n.kind === 'final' ? 'Level 5 · Kuis Akhir' : `Topik ${n.moduleNo} · ${n.title} ${n.subtitle}`);

/** Alamat untuk membuka titik. */
export const nodeRoute = (n) => (n.kind === 'final' ? '/kuis-akhir' : `/latihan/${n.id}`);

/**
 * Status tiap titik: selesai, sedang dikerjakan (titik pertama yang belum selesai), atau terkunci.
 * Latihan topik selesai bila: lulus latihan 10 soal (`practiceDone` / riwayat), ATAU pernah lulus Level 4 lama
 * (riwayat `t*-l4` — siswa yang sudah menuntaskan jalur lama tidak mengulang), ATAU kuis topiknya sudah dikerjakan.
 * Kuis Akhir selesai setelah dikerjakan (hasilnya tersimpan).
 * @param {PathNode[]} nodes
 * @param {(moduleId: string) => {completed: boolean, practiceDone?: boolean}} getProgress
 * @param {Set<string>} passedNodeIds titik yang pernah lulus (dari riwayat, id asli termasuk id lama)
 * @returns {Record<string, NodeStatus>}
 */
export function nodeStatuses(nodes, getProgress, passedNodeIds = new Set()) {
  const out = {};
  let currentFound = false;
  for (const n of nodes) {
    const p = getProgress(n.moduleId);
    const done =
      n.kind === 'final'
        ? !!p?.completed
        : !!(p.completed || p.practiceDone || passedNodeIds.has(n.id) || passedNodeIds.has(`${n.moduleId}-l4`));
    if (done && !currentFound) out[n.id] = 'done';
    else if (!currentFound) {
      out[n.id] = 'current';
      currentFound = true;
    } else out[n.id] = done ? 'done' : 'locked';
  }
  return out;
}
