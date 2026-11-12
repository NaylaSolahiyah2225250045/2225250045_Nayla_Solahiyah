/**
 * Jalur Latihan: setiap titik = satu tahapan (Level 1–4 tiap modul, lalu kuis modul).
 * Status titik dihitung dari progres & riwayat yang sudah ada (tidak ada data baru).
 *
 * @typedef {{ id: string, moduleId: string, moduleNo: number, moduleTitle: string,
 *   kind: 'level'|'kuis', level: number|null, title: string, subtitle: string }} PathNode
 * @typedef {'done'|'current'|'locked'} NodeStatus
 */

const LEVEL_NAMES = { 1: 'Pemula', 2: 'Berkembang', 3: 'Cakap', 4: 'Mahir' };

/** @param {{id:string, no:number, title:string, comingSoon?:boolean}[]} modules @returns {PathNode[]} */
export function buildPath(modules) {
  return modules
    .filter((m) => !m.comingSoon)
    .flatMap((m) => [
      ...[1, 2, 3, 4].map((level) => ({
        id: `${m.id}-l${level}`,
        moduleId: m.id,
        moduleNo: m.no,
        moduleTitle: m.title,
        kind: 'level',
        level,
        title: `Level ${level}`,
        subtitle: LEVEL_NAMES[level],
      })),
      { id: `${m.id}-kuis`, moduleId: m.id, moduleNo: m.no, moduleTitle: m.title, kind: 'kuis', level: null, title: 'Kuis', subtitle: `Modul ${m.no}` },
    ]);
}

/**
 * Status tiap titik: selesai, sedang dikerjakan (titik pertama yang belum selesai), atau terkunci.
 * @param {PathNode[]} nodes
 * @param {(moduleId: string) => {levelUnlocked: number, completed: boolean}} getProgress
 * @param {Set<string>} passedNodeIds titik yang pernah lulus (dari riwayat)
 * @returns {Record<string, NodeStatus>}
 */
export function nodeStatuses(nodes, getProgress, passedNodeIds = new Set()) {
  const out = {};
  let currentFound = false;
  for (const n of nodes) {
    const p = getProgress(n.moduleId);
    const done =
      p.completed || passedNodeIds.has(n.id) || (n.kind === 'level' ? p.levelUnlocked > n.level : false);
    if (done && !currentFound) out[n.id] = 'done';
    else if (!currentFound) {
      out[n.id] = 'current';
      currentFound = true;
    } else out[n.id] = done ? 'done' : 'locked';
  }
  return out;
}
