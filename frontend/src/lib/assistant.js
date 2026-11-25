/**
 * Asisten Belajar (docs/AI-TUTOR.md): klien ke backend /api/v1/ai/*.
 *
 * Keamanan & privasi:
 *  - Kunci Groq TIDAK PERNAH ada di frontend; frontend hanya memakai token login siswa ke server sekolah.
 *  - Hanya tersedia di mode server (akun punya token). Mode lokal & pratinjau: asisten disembunyikan.
 *  - Konteks yang dikirim hanya teks soal (+ pertanyaan pemandu & aturan umum RMT). Tanpa nama, username, kelas.
 *  - `key_texts` (bentuk kunci jawaban) dipakai backend untuk MENYARING balasan agar jawaban akhir tidak bocor;
 *    backend tidak meneruskannya ke penyedia AI.
 */
import { apiFetch, ApiError, isServerMode, NetworkError } from './api.js';
import { getToken } from './account.js';
import { answerKey, operationText, operationValue, placeValueOf, promptText, toStandard } from './sci/index.js';
import { powText, sciText } from './sci/format.js';
import { mediationFor, skillOf, topicOf } from './rmt.js';
import { getModule } from '../content/modules.js';
import { CHOICE_TASK, TASKS, TOPIC_FOCUS } from '../content/assistantTasks.js';
import { visualsFor } from './assistantVisuals.js';

const UNAVAILABLE = { available: false, daily_limit: 0, remaining: 0 };
export const MAX_MESSAGE_CHARS = 300;

let statusPromise = null;
let statusToken = null;

/** Status asisten (disimpan per token agar tidak memanggil server di setiap soal). */
export function assistantStatus() {
  const token = getToken();
  if (!isServerMode() || !token) return Promise.resolve(UNAVAILABLE);
  if (!statusPromise || statusToken !== token) {
    statusToken = token;
    statusPromise = apiFetch('/ai/status', { token }).catch(() => UNAVAILABLE);
  }
  return statusPromise;
}

/** Untuk tes / setelah keluar-masuk akun. */
export function resetAssistantStatus() {
  statusPromise = null;
  statusToken = null;
}

/** Teks bilangan yang ditampilkan di bawah kalimat soal (sama dengan QuestionValue). */
function valueText(q) {
  switch (q.type) {
    case 'to_scientific':
    case 'power_of_ten':
    case 'place_value':
      return q.value;
    case 'normalize':
    case 'to_standard':
      return sciText(q.a, q.n);
    case 'ten_to_standard':
      return powText(q.n);
    case 'operation':
      return q.text ? '' : operationText(q);
    default:
      return '';
  }
}

/** Semua bentuk kunci jawaban yang tidak boleh muncul di balasan asisten. */
function keyTexts(q) {
  const key = answerKey(q);
  switch (q.type) {
    case 'to_scientific':
    case 'normalize':
      return [sciText(key.a, key.n), `${key.a} × 10^${key.n}`];
    case 'operation':
      return [sciText(key.a, key.n), `${key.a} × 10^${key.n}`, toStandard(operationValue(q))];
    case 'power_of_ten':
      return [powText(key), `10^${key}`];
    case 'to_standard':
    case 'ten_to_standard':
      return [key];
    case 'place_value': {
      // "7 × 100" juga kunci (uji 25 Nov 2026: AI menulis "kalikan 7 dengan 10²"; bentuk 7 × 10² sudah tertangkap menurut nilai).
      const { digit, answer } = placeValueOf(q.value, q.pos);
      return [answer, `${digit} × ${toStandard({ sign: 1, digits: '1', exp: q.pos })}`];
    }
    case 'choose_correct': {
      const opt = q.options.find((o) => o.key === key);
      if (!opt) return [];
      // Ekspresi matematika di dalam pilihan benar juga kunci ("…, jadi 3 × 10³" → "3 × 10³"), agar AI tidak
      // menyelesaikan soal lalu menyebut hasilnya tanpa mengutip kalimat pilihannya (temuan uji 25 Nov 2026).
      const parts = (opt.text.match(/\d+(?:[.,]\d+)*\s*×\s*10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+|10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+|\d+(?:[.,]\d+)+|\d{3,}/g) ?? []).filter((p) => p !== opt.text);
      return [opt.text, ...new Set(parts)];
    }
    default:
      return [];
  }
}

function questionText(q) {
  const lines = [promptText(q)];
  const v = valueText(q);
  if (v && !lines[0].includes(v)) lines.push(v);
  if (q.type === 'choose_correct') lines.push(...q.options.map((o) => `${o.key}. ${o.text}`));
  if (q.type === 'operation' && q.unit) lines.push(`(Jawaban ditulis dalam bentuk baku, satuan ${q.unit}.)`);
  return lines.filter(Boolean).join('\n');
}

/**
 * Visual matematika yang boleh dipilih asisten untuk soal ini (contoh serupa, dihitung lib/sci).
 * Contoh yang bilangannya muncul di soal atau di kuncinya dilewati.
 * @param {object} q @param {string|null} [topicId]
 */
export function assistantVisuals(q, topicId = null) {
  const keys = keyTexts(q).filter((k) => k && /\d/.test(k));
  return visualsFor(q, topicId, [questionText(q), ...keys].join('\n'), keys);
}

/**
 * Topik & maksud soal dalam bahasa sehari-hari (25 Nov 2026) — agar asisten bisa menjawab "maksud soal ini apa?"
 * dan pesan cadangan tetap nyambung. Tidak memuat kunci jawaban.
 * @param {object} q @param {string|null} [topicId]
 * @returns {{topic: string|null, task: string|null}}
 */
export function questionMeaning(q, topicId = null) {
  const t = topicOf(q, topicId);
  const mod = t ? getModule(t) : null;
  const topic = mod ? `Topik ${mod.no} · ${mod.title}${TOPIC_FOCUS[t] ? ` — konsep: ${TOPIC_FOCUS[t]}` : ''}` : null;
  const skill = skillOf(q);
  let task = skill ? TASKS[skill] : q.type === 'choose_correct' ? CHOICE_TASK : null;
  if (task && q.type === 'place_value') task = task.replace('{digit}', placeValueOf(q.value, q.pos).digit);
  return { topic, task: task ?? null };
}

/**
 * Konteks soal untuk asisten — hanya isi soal, tanpa data siswa.
 * `visuals` hanya berisi id + ringkasan (angka contoh sudah dihitung mesin); data gambarnya tetap di perangkat.
 * @param {object} q soal (tidak diubah)
 * @param {string|null} [topicId]
 */
export function buildAssistantContext(q, topicId = null) {
  const med = mediationFor(q, topicId);
  const { topic, task } = questionMeaning(q, topicId);
  return {
    text: questionText(q),
    topic,
    task,
    skill: skillOf(q),
    guide: med?.guide ?? null,
    rule: med?.rule ?? null,
    key_texts: keyTexts(q).filter(Boolean).slice(0, 8),
    visuals: assistantVisuals(q, topicId).map((v) => ({ id: v.id, summary: v.summary })),
  };
}

/** Banyak pesan terakhir yang dikirim ke server (8 giliran; sama dengan backend guardrails.MAX_HISTORY). */
export const HISTORY_WINDOW = 16;

/**
 * Riwayat untuk server (26 Nov 2026). Dulu SELURUH percakapan dikirim, padahal server menolak > 20 pesan,
 * sehingga pertanyaan ke-11 selalu gagal. Kini: jendela pesan terakhir yang selalu dimulai dari pesan siswa,
 * penanda visual yang sudah tampil, dan asal balasan (`source`, agar pesan cadangan ditandai untuk model).
 * @param {{role: 'user'|'assistant', content: string, visual?: string|null, source?: 'ai'|'fallback'}[]} messages
 */
export function historyForServer(messages) {
  let win = messages.slice(-HISTORY_WINDOW);
  while (win.length && win[0].role !== 'user') win = win.slice(1);
  return win.map((m) => ({
    role: m.role,
    content: m.visual ? `${m.content}\n[[visual:${m.visual}]]` : m.content,
    ...(m.role === 'assistant' && m.source ? { source: m.source } : {}),
  }));
}

/** Pesan galat ramah siswa. */
function errorMessage(err) {
  if (err instanceof NetworkError) return 'Tidak tersambung ke server sekolah. Coba lagi sebentar lagi, ya.';
  if (err instanceof ApiError) {
    if (err.code === 'AI_LIMIT') return err.message;
    if (err.code === 'AI_DISABLED') return 'Asisten Belajar sedang tidak aktif.';
    if (err.status === 401) return 'Sesi berakhir. Silakan masuk lagi.';
  }
  return 'Asisten sedang tidak bisa menjawab. Coba lagi, ya.';
}

/**
 * Kirim percakapan ke asisten.
 * @param {ReturnType<typeof buildAssistantContext>} context
 * @param {{role: 'user'|'assistant', content: string}[]} messages
 * @returns {Promise<{ok: true, reply: string, visual: string|null, source: 'ai'|'fallback', remaining: number} | {ok: false, error: string, code?: string}>}
 */
export async function askAssistant(context, messages) {
  try {
    const r = await apiFetch('/ai/chat', { method: 'POST', token: getToken(), body: { context, messages } });
    return { ok: true, ...r };
  } catch (err) {
    return { ok: false, error: errorMessage(err), code: err?.code };
  }
}
