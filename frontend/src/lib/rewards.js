/**
 * XP & lencana (disetujui pengembang, 11 Nov 2026).
 * Dihitung dari data progres/aktivitas yang sudah ada — tidak ada data baru yang disimpan.
 * Sifatnya pribadi & non-kompetitif: tidak ada papan peringkat atau perbandingan antarsiswa.
 */

export const XP_PER_CORRECT = 10;
export const XP_PER_MODULE = 50;
export const XP_PER_LEVEL = 250;

/**
 * @typedef {{answered:number, correct:number, completed:boolean, bestQuiz:number|null, levelUnlocked:number}} ModuleProgress
 * @typedef {{ activeDays?: number, retries?: number, labMoves?: number, bookPages?: number }} ExtraStats
 * @param {Record<string, ModuleProgress>} modules
 * @param {ExtraStats} [stats]
 */
export function summarize(modules, stats = {}) {
  const list = Object.entries(modules);
  return {
    correct: list.reduce((s, [, p]) => s + (p.correct ?? 0), 0),
    completed: list.filter(([, p]) => p.completed).map(([id]) => id),
    perfectQuiz: list.some(([, p]) => p.bestQuiz === 100),
    maxLevel: list.reduce((m, [, p]) => Math.max(m, p.levelUnlocked ?? 1), 1),
    // Latihan topik (10 soal) yang sudah lulus — pengganti "membuka Level 4" sejak 23 Nov 2026.
    practicesDone: list.filter(([, p]) => p.practiceDone).length,
    activeDays: stats.activeDays ?? 0,
    retries: stats.retries ?? 0,
    labMoves: stats.labMoves ?? 0,
    bookPages: stats.bookPages ?? 0,
  };
}

/**
 * Lencana: nama, desain (tier medali + emblem unik di tengah), dan kriteria.
 * `goal`/`value` dipakai untuk menampilkan kemajuan menuju lencana yang masih terkunci.
 */
export const BADGES = [
  { id: 'langkah-pertama', name: 'Langkah Pertama', desc: 'Menjawab benar untuk pertama kali', tier: 'bronze', emblem: '1', goal: 1, value: (s) => s.correct },
  { id: 'pembaca-buku', name: 'Kutu Buku', desc: 'Membaca 10 halaman buku materi', tier: 'bronze', emblem: '📖', goal: 10, value: (s) => s.bookPages },
  { id: 'kenal-pangkat', name: 'Kenal Pangkat 10', desc: 'Menyelesaikan Topik 1', tier: 'bronze', emblem: '10ⁿ', goal: 1, value: (s) => (s.completed.includes('t1') ? 1 : 0) },
  { id: 'rajin-berlatih', name: 'Rajin Berlatih', desc: 'Mengumpulkan 25 jawaban tepat', tier: 'silver', emblem: '25', goal: 25, value: (s) => s.correct },
  { id: 'bilangan-besar', name: 'Penakluk Bilangan Besar & Kecil', desc: 'Menyelesaikan Topik 2', tier: 'silver', emblem: '10⁹', goal: 1, value: (s) => (s.completed.includes('t2') ? 1 : 0) },
  { id: 'tiga-hari', name: 'Tiga Hari Belajar', desc: 'Belajar di 3 hari yang berbeda', tier: 'silver', emblem: '3', goal: 3, value: (s) => s.activeDays },
  { id: 'pantang-menyerah', name: 'Pantang Menyerah', desc: 'Mengulang soal yang pernah salah', tier: 'silver', emblem: '↻', goal: 1, value: (s) => s.retries },
  { id: 'penjelajah-koma', name: 'Penjelajah Koma', desc: 'Menggeser koma 20 kali di Lab Koma', tier: 'bronze', emblem: ',', goal: 20, value: (s) => s.labMoves },
  // 23 Nov 2026: latihan menjadi 1 level per topik. Lencana diraih dengan lulus latihan 4 topik; yang sudah
  // meraihnya lewat Level 4 lama (maxLevel = 4) tetap memilikinya.
  { id: 'level-mahir', name: 'Sampai Level Mahir', desc: 'Lulus latihan 4 topik', tier: 'silver', emblem: 'L4', goal: 4, value: (s) => Math.max(s.maxLevel, s.practicesDone ?? 0) },
  { id: 'pangkat-negatif', name: 'Ahli Mengubah Bentuk', desc: 'Menyelesaikan Topik 3', tier: 'gold', emblem: '⇄', goal: 1, value: (s) => (s.completed.includes('t3') ? 1 : 0) },
  { id: 'kuis-sempurna', name: 'Kuis Sempurna', desc: 'Mendapat skor 100 di kuis', tier: 'gold', emblem: '100', goal: 1, value: (s) => (s.perfectQuiz ? 1 : 0) },
];

/** XP, level, dan lencana (diraih/terkunci + kemajuan). */
export function computeRewards(modules, stats = {}) {
  const s = summarize(modules, stats);
  const xp = s.correct * XP_PER_CORRECT + s.completed.length * XP_PER_MODULE;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  return {
    xp,
    level,
    levelStart: (level - 1) * XP_PER_LEVEL,
    nextLevelAt: level * XP_PER_LEVEL,
    badges: BADGES.map(({ value, ...b }) => {
      const v = Math.min(b.goal, value(s));
      return { ...b, progress: v, earned: v >= b.goal };
    }),
  };
}
