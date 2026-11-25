/**
 * Pembaca konten mediasi RMT (content/rmt.js, docs/RMT.md).
 * Semua fungsi murni dan HANYA MEMBACA objek soal — tidak pernah mengubah soal, kunci, petunjuk, atau penilaian.
 */
import { BANK, FINAL_QUIZ } from '../content/bank.js';
import { ERROR_PHASES, FINAL_GOAL, LEVEL_GOALS, PHASES, QUIZ_GOAL, SKILLS, TOPIC_RULES } from '../content/rmt.js';

/** @typedef {{guide: string, rule: string}} Mediation */

const STORY_TYPES = ['operation'];

/**
 * Keterampilan yang dilatih sebuah soal, ditentukan dari jenis soalnya.
 * Pilihan ganda konsep (tanpa `focus`) → null (pakai pertanyaan & aturan topik).
 * @param {object} q
 * @returns {keyof typeof SKILLS | null}
 */
export function skillOf(q) {
  if (!q) return null;
  if (q.type === 'choose_correct') {
    if (q.focus === 'compare') return 'banding';
    if (q.focus === 'zero') return 'nolTengah';
    if (q.focus === 'back') return 'keBiasa';
    return null;
  }
  if (q.text && STORY_TYPES.includes(q.type)) return 'cerita';
  switch (q.type) {
    case 'power_of_ten':
    case 'ten_to_standard':
      return 'pangkat10';
    case 'place_value':
      return 'nilaiTempat';
    case 'to_scientific':
      return q.focus === 'zero' ? 'nolTengah' : 'keBaku';
    case 'to_standard':
      return 'keBiasa';
    case 'normalize':
      return 'normal';
    case 'operation':
      return q.op === 'bagi' ? 'bagi' : 'kali';
    default:
      return null;
  }
}

// Peta `form` pilihan ganda (unik di seluruh bank, dijaga content.test.js) → topik, agar soal yang
// dibuka lagi dari Riwayat (salinan objek) tetap menemukan topiknya.
const FORM_TOPIC = new Map();
for (const [topic, b] of Object.entries(BANK)) {
  for (const q of [...Object.values(b.levels).flat(), ...b.quiz]) if (q.form) FORM_TOPIC.set(q.form, topic);
}
const isTopic = (id) => typeof id === 'string' && Object.hasOwn(TOPIC_RULES, id);
/** `topic` di Kuis Akhir berupa nomor topik (1–5) → 't1'…'t5'. */
const topicId = (t) => (typeof t === 'number' ? `t${t}` : t);

for (const q of FINAL_QUIZ) if (q.form && isTopic(topicId(q.topic))) FORM_TOPIC.set(q.form, topicId(q.topic));

/**
 * Topik sebuah soal: dari `q.topic` (Kuis Akhir), dari `form` pilihan ganda, atau dari konteks halaman.
 * @param {object} q
 * @param {string|null} [fallback] id topik dari halaman (mis. moduleId sesi)
 */
export function topicOf(q, fallback = null) {
  if (isTopic(topicId(q?.topic))) return topicId(q.topic);
  if (q?.form && FORM_TOPIC.has(q.form)) return FORM_TOPIC.get(q.form);
  return isTopic(fallback) ? fallback : null;
}

/**
 * Pertanyaan pemandu & aturan umum untuk satu soal (keterampilan → topik → null).
 * @param {object} q
 * @param {string|null} [topicId]
 * @returns {Mediation | null}
 */
export function mediationFor(q, topicId = null) {
  const skill = skillOf(q);
  if (skill) return SKILLS[skill];
  const topic = topicOf(q, topicId);
  return topic ? TOPIC_RULES[topic] : null;
}

/** Pertanyaan pemandu & aturan umum sebuah topik (untuk ringkasan di akhir sesi). */
export const topicMediation = (topicId) => (isTopic(topicId) ? TOPIC_RULES[topicId] : null);

/**
 * Tujuan & alasan penting sebuah titik latihan atau kuis.
 * @param {{kind: 'level'|'quiz'|'final', topicId?: string|null, level?: number}} where
 * @returns {{goal: string, why: string} | null}
 */
export function goalFor({ kind, topicId = null, level }) {
  if (kind === 'final') return FINAL_GOAL;
  if (kind === 'quiz') return isTopic(topicId) ? QUIZ_GOAL : null;
  return LEVEL_GOALS[topicId]?.[level] ?? null;
}

/**
 * Fase fungsi kognitif yang mungkin terlibat pada sebuah kode kesalahan (bisa lebih dari satu, bisa kosong).
 * @param {string|null|undefined} code
 * @returns {('input'|'elaborasi'|'output')[]}
 */
export const phasesOf = (code) => ERROR_PHASES[code]?.phases ?? [];

/** Label fase untuk guru, mis. "Input/Elaborasi"; '' bila belum cukup bukti. */
export const phaseLabel = (code) =>
  phasesOf(code)
    .map((p) => PHASES[p].label)
    .join('/');
