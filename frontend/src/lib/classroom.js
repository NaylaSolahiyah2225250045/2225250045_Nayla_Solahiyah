/**
 * Kelas & laporan guru (17 Nov 2026).
 *
 * Dua sumber data dengan bentuk & aturan akses yang SAMA:
 *  - server sekolah (backend FastAPI) bila akun yang masuk punya token (lib/api.js);
 *  - mode lokal: data kelas di perangkat ini (`nobaku.classroom.v1`) — untuk uji coba/presentasi,
 *    guru & siswa memakai browser yang sama.
 * Guru hanya bisa melihat/mengubah kelas miliknya sendiri; kelas guru lain dianggap "tidak ditemukan".
 *
 * @typedef {{ id: string, name: string, grade: string, academic_year: string|null, join_code: string,
 *   join_enabled: boolean, student_count: number, created_at: string }} ClassInfo
 * @typedef {{ id: string, display_name: string, username: string|null, joined_at: string,
 *   snapshot?: object|null, snapshot_at?: string|null }} StudentRow
 */
import { apiFetch, ApiError } from './api.js';
import { accountSummary, getSession, getToken, localStudentNames } from './account.js';

export const CLASS_NAMES = ['VIII-A', 'VIII-B', 'VIII-C', 'VIII-D', 'VIII-E'];
const KEY = 'nobaku.classroom.v1';
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/* ---------------- mode lokal ---------------- */
let memory = null; // cadangan bila localStorage diblokir (perubahan hanya selama sesi ini)
function load() {
  let raw = memory;
  try {
    raw = localStorage.getItem(KEY) ?? raw;
  } catch {
    /* pakai cadangan memori */
  }
  try {
    const s = JSON.parse(raw ?? 'null');
    return s && Array.isArray(s.classes) ? { classes: s.classes, snapshots: s.snapshots ?? {} } : { classes: [], snapshots: {} };
  } catch {
    return { classes: [], snapshots: {} };
  }
}
function save(s) {
  memory = JSON.stringify(s);
  try {
    localStorage.setItem(KEY, memory);
  } catch {
    /* penyimpanan diblokir — cadangan memori dipakai */
  }
}

const fail = (status, code, message) => new ApiError(status, { code, message });

function randomCode(taken) {
  for (;;) {
    const bytes = new Uint8Array(6);
    if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
    else for (let i = 0; i < 6; i++) bytes[i] = Math.floor(Math.random() * 256);
    const code = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    if (!taken.has(code)) return code;
  }
}

export const normalizeCode = (raw) => String(raw ?? '').trim().toUpperCase().replace(/[\s-]/g, '');

const me = () => getSession();
function requireRole(role) {
  const s = me();
  if (!s) throw fail(401, 'UNAUTHORIZED', 'Silakan masuk dulu.');
  if ((s.role ?? 'student') !== role) throw fail(403, 'FORBIDDEN', 'Fitur ini tidak tersedia untuk jenis akunmu.');
  return s;
}

const info = (c) => ({
  id: c.id,
  name: c.name,
  grade: 'VIII',
  academic_year: c.academic_year ?? null,
  join_code: c.join_code,
  join_enabled: c.join_enabled,
  student_count: c.members.length,
  created_at: c.created_at,
});

function rows(state, c, withSnapshot) {
  const names = localStudentNames();
  return c.members
    .map((m) => ({
      id: m.student,
      display_name: names[m.student] ?? m.student,
      username: m.student,
      joined_at: m.joined_at,
      ...(withSnapshot ? { snapshot: state.snapshots[m.student]?.data ?? null, snapshot_at: state.snapshots[m.student]?.updated_at ?? null } : {}),
    }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name, 'id'));
}

function ownedLocal(state, id) {
  const t = requireRole('teacher');
  const c = state.classes.find((x) => x.id === id);
  if (!c || c.teacher !== t.username) throw fail(404, 'NOT_FOUND', 'Kelas tidak ditemukan.');
  return c;
}

/** Implementasi lokal — bentuk keluaran sama dengan API server. Diekspor untuk pengujian. */
export const local = {
  async listClasses() {
    const t = requireRole('teacher');
    return load()
      .classes.filter((c) => c.teacher === t.username)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(info);
  },
  async createClass({ name, academic_year = null }) {
    const t = requireRole('teacher');
    if (!CLASS_NAMES.includes(name)) throw fail(422, 'VALIDATION_ERROR', 'Pilih kelas VIII-A sampai VIII-E.');
    const s = load();
    if (s.classes.some((c) => c.teacher === t.username && c.name === name)) throw fail(409, 'CLASS_EXISTS', `Kelas ${name} sudah kamu buat.`);
    const c = {
      id: `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      teacher: t.username,
      name,
      academic_year,
      join_code: randomCode(new Set(s.classes.map((x) => x.join_code))),
      join_enabled: true,
      created_at: new Date().toISOString(),
      members: [],
    };
    save({ ...s, classes: [...s.classes, c] });
    return info(c);
  },
  async updateClass(id, patch) {
    const s = load();
    const c = ownedLocal(s, id);
    if (typeof patch.join_enabled === 'boolean') c.join_enabled = patch.join_enabled;
    save(s);
    return info(c);
  },
  async regenerateCode(id) {
    const s = load();
    const c = ownedLocal(s, id);
    c.join_code = randomCode(new Set(s.classes.map((x) => x.join_code)));
    save(s);
    return info(c);
  },
  async deleteClass(id) {
    const s = load();
    ownedLocal(s, id);
    save({ ...s, classes: s.classes.filter((c) => c.id !== id) });
    return null;
  },
  async removeStudent(classId, studentId) {
    const s = load();
    const c = ownedLocal(s, classId);
    if (!c.members.some((m) => m.student === studentId)) throw fail(404, 'NOT_FOUND', 'Siswa tidak ada di kelas ini.');
    c.members = c.members.filter((m) => m.student !== studentId);
    save(s);
    return null;
  },
  async overview() {
    const t = requireRole('teacher');
    const s = load();
    return {
      classes: s.classes
        .filter((c) => c.teacher === t.username)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => ({ klass: info(c), students: rows(s, c, true) })),
    };
  },
  async studentDetail(studentId) {
    const t = requireRole('teacher');
    const s = load();
    const c = s.classes.find((x) => x.teacher === t.username && x.members.some((m) => m.student === studentId));
    if (!c) throw fail(404, 'NOT_FOUND', 'Siswa tidak ditemukan di kelasmu.');
    return { student: rows(s, c, true).find((r) => r.id === studentId), class_id: c.id, class_name: c.name };
  },
  async joinClass(raw) {
    const st = requireRole('student');
    const code = normalizeCode(raw);
    const s = load();
    const c = s.classes.find((x) => x.join_code === code);
    if (!c) throw fail(404, 'CLASS_CODE_INVALID', 'Kode kelas tidak ditemukan. Periksa lagi kodenya, ya.');
    if (!c.join_enabled) throw fail(403, 'CLASS_CLOSED', 'Kelas ini sedang tidak menerima siswa baru. Tanyakan ke gurumu.');
    const current = s.classes.find((x) => x.members.some((m) => m.student === st.username));
    if (current && current.id !== c.id) throw fail(409, 'ALREADY_IN_CLASS', 'Kamu sudah tergabung di kelas lain. Keluar dulu dari kelas itu.');
    if (!current) c.members.push({ student: st.username, joined_at: new Date().toISOString() });
    save(s);
    return (await local.myClasses()).find((x) => x.id === c.id);
  },
  async myClasses() {
    const st = requireRole('student');
    const s = load();
    return s.classes
      .filter((c) => c.members.some((m) => m.student === st.username))
      .map((c) => ({
        id: c.id,
        name: c.name,
        teacher_name: accountSummary(c.teacher)?.name ?? 'Guru',
        school: accountSummary(c.teacher)?.school ?? null,
        joined_at: c.members.find((m) => m.student === st.username).joined_at,
      }));
  },
  async leaveClass(id) {
    const st = requireRole('student');
    const s = load();
    const c = s.classes.find((x) => x.id === id && x.members.some((m) => m.student === st.username));
    if (!c) throw fail(404, 'NOT_FOUND', 'Kamu tidak tergabung di kelas ini.');
    c.members = c.members.filter((m) => m.student !== st.username);
    save(s);
    return null;
  },
  async pushSnapshot(data) {
    const st = requireRole('student');
    const s = load();
    s.snapshots[st.username] = { data, updated_at: new Date().toISOString() };
    save(s);
    return null;
  },
};

/* ---------------- server sekolah ---------------- */
const call = (path, opts = {}) => apiFetch(path, { ...opts, token: getToken() });
const remote = {
  listClasses: () => call('/classes'),
  createClass: (body) => call('/classes', { method: 'POST', body }),
  updateClass: (id, body) => call(`/classes/${id}`, { method: 'PATCH', body }),
  regenerateCode: (id) => call(`/classes/${id}/regenerate-code`, { method: 'POST' }),
  deleteClass: (id) => call(`/classes/${id}`, { method: 'DELETE' }),
  removeStudent: (classId, studentId) => call(`/classes/${classId}/students/${studentId}`, { method: 'DELETE' }),
  overview: () => call('/reports/overview'),
  studentDetail: (id) => call(`/reports/students/${id}`),
  joinClass: (code) => call('/classes/join', { method: 'POST', body: { class_code: normalizeCode(code) } }),
  myClasses: () => call('/me/classes'),
  leaveClass: (id) => call(`/me/classes/${id}`, { method: 'DELETE' }),
  pushSnapshot: (data) => call('/sync/me', { method: 'PUT', body: { data } }),
};

/** Sumber data untuk akun yang sedang masuk. */
export function classroom() {
  return getToken() ? remote : local;
}

/** Apakah data kelas tersimpan di server sekolah (true) atau hanya di perangkat ini (false). */
export const usesServer = () => !!getToken();
